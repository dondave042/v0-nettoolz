import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDb } from '@/lib/db';
import { getPaymentConfig } from '@/lib/payment-config';
import { PaymentStatus } from '@/lib/payment-status';
import {
  PaymentWebhookError,
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

function validateSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

async function isDuplicateWebhook(sql: ReturnType<typeof getDb>, reference: string): Promise<boolean> {
  try {
    const existing = await sql`
      SELECT id FROM payment_webhooks WHERE reference_id = ${reference} LIMIT 1
    `;
    return existing.length > 0;
  } catch (error) {
    console.error('[Webhook] Error checking duplicate:', error);
    return true; // Treat as duplicate on DB error to be safe
  }
}

async function logWebhookEvent(
  sql: ReturnType<typeof getDb>,
  reference: string,
  orderId: string | null,
  eventType: string,
  payload: KorapayWebhookPayload,
  status: 'processed' | 'failed' | 'skipped',
  errorMessage?: string
): Promise<void> {
  try {
    await sql`
      INSERT INTO payment_webhooks (reference_id, order_id, event_type, payload, status, error_message, created_at)
      VALUES (
        ${reference},
        ${orderId},
        ${eventType},
        ${JSON.stringify(payload)},
        ${status},
        ${errorMessage ?? null},
        NOW()
      )
    `;
  } catch (error) {
    console.error('[Webhook] Error logging webhook event:', error);
  }
}

async function findOrderByReference(
  sql: ReturnType<typeof getDb>,
  reference: string
): Promise<{ id: string; buyer_id: string; product_id: string; quantity: number; buyer_email: string } | null> {
  const result = await sql`
    SELECT id, buyer_id, product_id, quantity, buyer_email
    FROM orders
    WHERE payment_reference_id = ${reference}
    LIMIT 1
  `;
  return result.length > 0 ? (result[0] as any) : null;
}

async function handlePaymentCompleted(
  sql: ReturnType<typeof getDb>,
  payload: KorapayWebhookPayload,
  order: { id: string; buyer_id: string; product_id: string; quantity: number; buyer_email: string }
): Promise<void> {
  // Get available credentials
  const credentials = await sql`
    SELECT id FROM buyer_credentials_inventory
    WHERE product_id = ${order.product_id} AND assigned_to_buyer_id IS NULL
    LIMIT ${order.quantity}
  `;

  if (credentials.length < order.quantity) {
    throw new WebhookProcessingError(
      `Insufficient credentials for order ${order.id}. Available: ${credentials.length}, needed: ${order.quantity}`
    );
  }

  // Assign each credential to the buyer
  for (const cred of credentials as any[]) {
    await sql`
      UPDATE buyer_credentials_inventory
      SET assigned_to_buyer_id = ${order.buyer_id}, assigned_at = NOW()
      WHERE id = ${cred.id}
    `;
  }

  // Update order to completed with payment details
  await sql`
    UPDATE orders
    SET
      status = 'completed',
      payment_status = ${PaymentStatus.COMPLETED},
      payment_completed_at = NOW(),
      payment_amount = ${payload.data.amount},
      payment_currency = ${payload.data.currency}
    WHERE id = ${order.id}
  `;

  // Decrease product available quantity
  await sql`
    UPDATE products
    SET available_qty = available_qty - ${order.quantity}
    WHERE id = ${order.product_id}
  `;

  console.log(`[Webhook] Completed order ${order.id}, assigned ${credentials.length} credential(s)`);
}

async function handlePaymentFailed(
  sql: ReturnType<typeof getDb>,
  payload: KorapayWebhookPayload,
  order: { id: string }
): Promise<void> {
  await sql`
    UPDATE orders
    SET
      payment_status = ${PaymentStatus.FAILED},
      payment_failed_at = NOW(),
      payment_error_message = ${payload.data.metadata?.error_message ?? 'Payment processing failed'}
    WHERE id = ${order.id}
  `;
  console.log(`[Webhook] Payment failed for order ${order.id}`);
}

async function handlePaymentCancelled(
  sql: ReturnType<typeof getDb>,
  payload: KorapayWebhookPayload,
  order: { id: string }
): Promise<void> {
  await sql`
    UPDATE orders
    SET
      payment_status = ${PaymentStatus.CANCELLED},
      payment_cancelled_at = NOW()
    WHERE id = ${order.id}
  `;
  console.log(`[Webhook] Payment cancelled for order ${order.id}`);
}

export async function POST(request: NextRequest) {
  const sql = getDb();

  let config;
  try {
    config = getPaymentConfig();
  } catch (error) {
    console.error('[Webhook] Payment configuration is invalid:', error);
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  // Read raw body for HMAC verification
  const body = await request.text();
  const signature = request.headers.get('x-korapay-signature');

  if (!signature) {
    console.warn('[Webhook] Missing x-korapay-signature header');
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
  }

  if (!validateSignature(body, signature, config.korapayWebhookSecret)) {
    console.warn('[Webhook] Invalid webhook signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: KorapayWebhookPayload;
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const reference = payload.data?.reference;
  const eventType = payload.event;

  if (!reference || !eventType) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // In-process duplicate guard (for concurrent requests in the same instance)
  if (processingWebhooks.has(reference)) {
    console.warn('[Webhook] Already processing:', reference);
    return NextResponse.json({ success: true }, { status: 200 });
  }
  processingWebhooks.add(reference);

  try {
    // Persistent duplicate guard (across restarts / multiple instances)
    const isDuplicate = await isDuplicateWebhook(sql, reference);
    if (isDuplicate) {
      console.log('[Webhook] Duplicate webhook, skipping:', reference);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const order = await findOrderByReference(sql, reference);

    if (!order) {
      console.warn('[Webhook] No order found for reference:', reference);
      await logWebhookEvent(sql, reference, null, eventType, payload, 'failed', 'Order not found');
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    switch (eventType) {
      case 'charge.completed':
        await handlePaymentCompleted(sql, payload, order);
        await logWebhookEvent(sql, reference, order.id, eventType, payload, 'processed');
        break;

      case 'charge.failed':
        await handlePaymentFailed(sql, payload, order);
        await logWebhookEvent(sql, reference, order.id, eventType, payload, 'processed');
        break;

      case 'charge.cancelled':
        await handlePaymentCancelled(sql, payload, order);
        await logWebhookEvent(sql, reference, order.id, eventType, payload, 'processed');
        break;

      default:
        console.log('[Webhook] Unhandled event type:', eventType);
        await logWebhookEvent(sql, reference, order.id, eventType, payload, 'skipped', 'Unhandled event type');
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[Webhook] Error processing webhook:', error);
    await logWebhookEvent(
      sql,
      reference,
      null,
      eventType,
      payload,
      'failed',
      error instanceof Error ? error.message : 'Unknown error'
    ).catch(() => {});

    if (error instanceof PaymentWebhookError) {
      return NextResponse.json({ error: error.message }, { status: (error as any).statusCode ?? 500 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    processingWebhooks.delete(reference);
  }
}
