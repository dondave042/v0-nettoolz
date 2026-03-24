import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDb } from '@/lib/db';
import { getPaymentConfig, validateWebhookSignature } from '@/lib/payment-config';
import { PaymentStatus } from '@/lib/payment-status';
import {
  PaymentWebhookError,
  DuplicateWebhookError,
  InvalidSignatureError,
  WebhookProcessingError,
} from '@/lib/payment-errors';

/**
 * Korapay Webhook Handler
 * 
 * This endpoint handles payment notifications from Korapay for:
 * - charge.completed: Payment successful
 * - charge.failed: Payment failed
 * - charge.cancelled: Payment cancelled by user
 * 
 * The webhook validates the signature, prevents duplicate processing,
 * and updates order status and credentials accordingly.
 */

interface KorapayWebhookPayload {
  event: string;
  data: {
    reference: string;
    status: string;
    amount: number;
    currency: string;
    customer: {
      email: string;
      name: string;
    };
    metadata?: Record<string, any>;
    timestamp?: string;
  };
  timestamp: string;
}

// Webhook processing semaphore to prevent race conditions during concurrent requests
const processingWebhooks = new Set<string>();

/**
 * Validates the Korapay webhook signature
 * Korapay signs the webhook payload with HMAC-SHA256
 */
function validateSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Checks if this webhook has already been processed to prevent duplicates
 */
async function isDuplicateWebhook(reference: string): Promise<boolean> {
  try {
    const existing = await db.query(
      `SELECT id FROM payment_webhooks WHERE reference_id = ? LIMIT 1`,
      [reference]
    );
    return existing.length > 0;
  } catch (error) {
    console.error('[Webhook] Error checking duplicate webhook:', error);
    // If we can't check, treat as potential duplicate to be safe
    return true;
  }
}

/**
 * Records the webhook event for audit and debugging purposes
 */
async function logWebhookEvent(
  reference: string,
  orderId: string | null,
  eventType: string,
  payload: KorapayWebhookPayload,
  status: 'processed' | 'failed' | 'skipped',
  errorMessage?: string
): Promise<void> {
  try {
    await db.query(
      `INSERT INTO payment_webhooks (reference_id, order_id, event_type, payload, status, error_message, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        reference,
        orderId,
        eventType,
        JSON.stringify(payload),
        status,
        errorMessage || null,
      ]
    );
  } catch (error) {
    console.error('[Webhook] Error logging webhook event:', error);
    // Don't throw here - logging failure shouldn't block webhook processing
  }
}

/**
 * Finds the order associated with a Korapay payment reference
 */
async function findOrderByReference(
  reference: string
): Promise<{ id: string; buyer_email: string } | null> {
  try {
    const result = await db.query(
      `SELECT id, buyer_email FROM orders WHERE payment_reference_id = ? LIMIT 1`,
      [reference]
    );
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('[Webhook] Error finding order by reference:', error);
    throw new WebhookProcessingError(
      `Failed to find order for reference ${reference}`
    );
  }
}

/**
 * Handles successful payment event
 */
async function handlePaymentCompleted(
  payload: KorapayWebhookPayload,
  order: { id: string; buyer_email: string }
): Promise<void> {
  try {
    // Update order status to completed
    await db.query(
      `UPDATE orders 
       SET payment_status = ?, payment_completed_at = NOW(), payment_amount = ?, payment_currency = ?
       WHERE id = ?`,
      [
        PaymentStatus.COMPLETED,
        payload.data.amount,
        payload.data.currency,
        order.id,
      ]
    );

    console.log(
      `[Webhook] Payment completed for order ${order.id}, reference ${payload.data.reference}`
    );
  } catch (error) {
    console.error('[Webhook] Error updating order status:', error);
    throw new WebhookProcessingError(
      `Failed to update order status for order ${order.id}`
    );
  }
}

/**
 * Handles failed payment event
 */
async function handlePaymentFailed(
  payload: KorapayWebhookPayload,
  order: { id: string; buyer_email: string }
): Promise<void> {
  try {
    await db.query(
      `UPDATE orders 
       SET payment_status = ?, payment_failed_at = NOW(), payment_error_message = ?
       WHERE id = ?`,
      [
        PaymentStatus.FAILED,
        payload.data.metadata?.error_message || 'Payment processing failed',
        order.id,
      ]
    );

    console.log(
      `[Webhook] Payment failed for order ${order.id}, reference ${payload.data.reference}`
    );
  } catch (error) {
    console.error('[Webhook] Error updating failed order:', error);
    throw new WebhookProcessingError(
      `Failed to update order status for order ${order.id}`
    );
  }
}

/**
 * Handles cancelled payment event
 */
async function handlePaymentCancelled(
  payload: KorapayWebhookPayload,
  order: { id: string; buyer_email: string }
): Promise<void> {
  try {
    await db.query(
      `UPDATE orders 
       SET payment_status = ?, payment_cancelled_at = NOW()
       WHERE id = ?`,
      [PaymentStatus.CANCELLED, order.id]
    );

    console.log(
      `[Webhook] Payment cancelled for order ${order.id}, reference ${payload.data.reference}`
    );
  } catch (error) {
    console.error('[Webhook] Error updating cancelled order:', error);
    throw new WebhookProcessingError(
      `Failed to update order status for order ${order.id}`
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    let config;
    try {
      config = getPaymentConfig();
    } catch (error) {
      console.error('[Webhook] Payment configuration is invalid:', error);
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('x-korapay-signature');

    if (!signature) {
      console.warn('[Webhook] Missing signature header');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      );
    }

    // Validate webhook signature
    try {
      const isValid = validateSignature(
        body,
        signature,
        config.korapayWebhookSecret
      );

      if (!isValid) {
        console.warn('[Webhook] Invalid webhook signature');
        throw new InvalidSignatureError('Webhook signature validation failed');
      }
    } catch (error) {
      if (error instanceof InvalidSignatureError) {
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
      throw error;
    }

    // Parse webhook payload
    let payload: KorapayWebhookPayload;
    try {
      payload = JSON.parse(body);
    } catch (error) {
      console.error('[Webhook] Failed to parse webhook payload:', error);
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      );
    }

    const reference = payload.data.reference;
    const eventType = payload.event;

    // Validate required fields
    if (!reference || !eventType) {
      console.warn(
        '[Webhook] Missing required fields in webhook payload',
        { reference, eventType }
      );
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Prevent concurrent processing of the same webhook
    if (processingWebhooks.has(reference)) {
      console.warn('[Webhook] Webhook already being processed:', reference);
      return NextResponse.json(
        { error: 'Webhook already processing' },
        { status: 429 }
      );
    }

    processingWebhooks.add(reference);

    try {
      // Check for duplicate webhook
      const isDuplicate = await isDuplicateWebhook(reference);
      if (isDuplicate) {
        console.log('[Webhook] Duplicate webhook detected:', reference);
        await logWebhookEvent(
          reference,
          null,
          eventType,
          payload,
          'skipped',
          'Duplicate webhook'
        );
        return NextResponse.json({ success: true }, { status: 200 });
      }

      // Find associated order
      const order = await findOrderByReference(reference);

      if (!order) {
        console.warn(
          '[Webhook] Order not found for reference:',
          reference
        );
        await logWebhookEvent(
          reference,
          null,
          eventType,
          payload,
          'failed',
          'Order not found'
        );
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }

      // Process webhook based on event type
      switch (eventType) {
        case 'charge.completed':
          await handlePaymentCompleted(payload, order);
          await logWebhookEvent(
            reference,
            order.id,
            eventType,
            payload,
            'processed'
          );
          break;

        case 'charge.failed':
          await handlePaymentFailed(payload, order);
          await logWebhookEvent(
            reference,
            order.id,
            eventType,
            payload,
            'processed'
          );
          break;

        case 'charge.cancelled':
          await handlePaymentCancelled(payload, order);
          await logWebhookEvent(
            reference,
            order.id,
            eventType,
            payload,
            'processed'
          );
          break;

        default:
          console.log('[Webhook] Unhandled event type:', eventType);
          await logWebhookEvent(
            reference,
            order.id,
            eventType,
            payload,
            'skipped',
            'Unhandled event type'
          );
      }

      return NextResponse.json({ success: true }, { status: 200 });
    } finally {
      processingWebhooks.delete(reference);
    }
  } catch (error) {
    console.error('[Webhook] Unhandled error processing webhook:', error);

    if (error instanceof PaymentWebhookError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
