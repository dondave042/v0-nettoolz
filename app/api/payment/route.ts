import { NextResponse } from 'next/server'
import { getBuyerSession } from '@/lib/buyer-auth'
import { getDb } from '@/lib/db'
import { getPaymentConfig } from '@/lib/payment-config'
import {
  PaymentConfigError,
  PaymentAPIError,
  ValidationError,
} from '@/lib/payment-errors'

interface InitializePaymentRequest {
  orderId?: string
  orderIds?: Array<string | number>
  amount: number
  currency: string
  email: string
}

function normalizeOrderIds(input: InitializePaymentRequest): number[] {
  const rawIds = Array.isArray(input.orderIds) && input.orderIds.length > 0
    ? input.orderIds
    : input.orderId
      ? [input.orderId]
      : []

  const parsedIds = rawIds
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0)

  return Array.from(new Set(parsedIds))
}

async function safeParseJson(response: Response): Promise<any> {
  const text = await response.text()
  if (!text) {
    return {}
  }

  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

/**
 * POST /api/payment
 * Initializes payment with Korapay for an existing order
 * Returns checkout URL and payment reference
 */
export async function POST(request: Request) {
  const buyer = await getBuyerSession()

  if (!buyer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    let config
    try {
      config = getPaymentConfig()
    } catch (error) {
      console.error('[Payment] Payment configuration is invalid:', error)
      throw new PaymentConfigError(
        'Payment system is not properly configured. Please contact support.'
      )
    }

    const body = await request.json() as InitializePaymentRequest
    const { amount, currency, email } = body
    const normalizedOrderIds = normalizeOrderIds(body)
    const normalizedAmount = Number(amount)
    const requestOrigin = new URL(request.url).origin
    const callbackBaseUrl =
      process.env.NODE_ENV === 'production' &&
        (!config.webhookBaseUrl || /localhost|127\.0\.0\.1/i.test(config.webhookBaseUrl))
        ? requestOrigin
        : config.webhookBaseUrl

    // Validate required fields
    if (normalizedOrderIds.length === 0 || !normalizedAmount || !currency || !email) {
      throw new ValidationError(
        'Missing required fields: orderId/orderIds, amount, currency, email'
      )
    }

    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      throw new ValidationError('Amount must be greater than 0')
    }

    const sql = getDb()

    // Verify order exists and belongs to buyer
    const orders = await sql`
      SELECT id, buyer_id, payment_status, payment_reference_id 
      FROM orders 
      WHERE id = ANY(${normalizedOrderIds}) AND buyer_id = ${buyer.id}
    `

    if (orders.length !== normalizedOrderIds.length) {
      throw new ValidationError('Order not found or does not belong to this buyer')
    }

    // Prevent re-processing completed or failed payments
    for (const order of orders) {
      if (
        order.payment_status === 'completed' ||
        order.payment_status === 'failed'
      ) {
        throw new ValidationError(
          `Cannot initialize payment for order with status: ${order.payment_status}`
        )
      }
    }

    // Initialize Korapay payment
    const korapayReference = orders.find((order) => order.payment_reference_id)?.payment_reference_id || `ORD-${normalizedOrderIds.join('-')}-${Date.now()}`

    try {
      const korapayResponse = await fetch(
        `${config.korapayApiBaseUrl}/charges/initialize`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.korapayApiKeySecret}`,
          },
          body: JSON.stringify({
            amount: Math.round(normalizedAmount),
            currency: currency.toUpperCase(),
            reference: korapayReference,
            customer: {
              email: email,
              name: buyer.name || 'Customer',
            },
            metadata: {
              order_ids: normalizedOrderIds,
              buyer_id: buyer.id,
              payment_kind: 'order',
            },
            notification_url: `${callbackBaseUrl}/api/webhooks/korapay`,
            redirect_url: `${callbackBaseUrl}/dashboard?refresh=payment`,
          }),
        }
      )

      if (!korapayResponse.ok) {
        const errorData = await safeParseJson(korapayResponse)
        console.error('[Payment] Korapay API error:', errorData)
        throw new PaymentAPIError(
          `Korapay error: ${errorData.message || 'Unknown error'}`,
          korapayResponse.status
        )
      }

      const korapayData = await safeParseJson(korapayResponse)

      // Update order with payment reference if not already set
      await sql`
        UPDATE orders 
        SET payment_reference_id = ${korapayReference}
        WHERE id = ANY(${normalizedOrderIds})
      `

      return NextResponse.json({
        success: true,
        checkout_url: korapayData.data?.checkout_url || korapayData.checkout_url,
        reference: korapayReference,
        order_id: normalizedOrderIds[0],
        order_ids: normalizedOrderIds,
      })
    } catch (error) {
      if (error instanceof PaymentAPIError) {
        throw error
      }

      console.error('[Payment] Failed to initialize Korapay payment:', error)
      throw new PaymentAPIError(
        'Failed to initialize payment with payment provider',
        500
      )
    }
  } catch (error) {
    console.error('[Payment] Error processing payment:', error)

    if (error instanceof PaymentConfigError) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    if (error instanceof PaymentAPIError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/payment/:orderId
 * Retrieves payment status for an order
 */
export async function GET(request: Request) {
  const buyer = await getBuyerSession()

  if (!buyer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const url = new URL(request.url)
    const orderIdParam = url.searchParams.get('order_id')
    const orderId = Number(orderIdParam)

    if (!Number.isInteger(orderId) || orderId <= 0) {
      throw new ValidationError('Missing order_id parameter')
    }

    const sql = getDb()

    // Get order payment status
    const orders = await sql`
      SELECT 
        id,
        payment_status,
        payment_reference_id,
        payment_amount,
        payment_currency,
        payment_completed_at,
        payment_failed_at,
        payment_error_message
      FROM orders 
      WHERE id = ${orderId} AND buyer_id = ${buyer.id}
    `

    if (orders.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const order = orders[0]

    return NextResponse.json({
      order_id: orderId,
      payment_status: order.payment_status,
      payment_reference_id: order.payment_reference_id,
      amount: order.payment_amount,
      currency: order.payment_currency,
      completed_at: order.payment_completed_at,
      failed_at: order.payment_failed_at,
      error_message: order.payment_error_message,
    })
  } catch (error) {
    console.error('[Payment] Error fetching payment status:', error)

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch payment status' },
      { status: 500 }
    )
  }
}
