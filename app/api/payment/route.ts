import { NextResponse } from 'next/server'
import { getBuyerSession } from '@/lib/buyer-auth'
import { getDb } from '@/lib/db'
import { getPaymentConfig } from '@/lib/payment-config'
import {
  PaymentConfigError,
  PaymentAPIError,
  ValidationError,
} from '@/lib/payment-errors'

/**
 * Assign credentials to a buyer after successful payment
 */
async function assignCredentialsToBuyer(sql: any, orderId: string, buyerId: number, productId: number, quantity: number) {
  try {
    // Get available credentials for this product
    const availableCredentials = await sql`
      SELECT id FROM buyer_credentials_inventory
      WHERE product_id = ${productId} AND assigned_to_buyer_id IS NULL
      ORDER BY created_at ASC
      LIMIT ${quantity}
    `

    if (availableCredentials.length < quantity) {
      throw new ValidationError(`Only ${availableCredentials.length} credentials available, requested ${quantity}`)
    }

    // Assign credentials to buyer
    const credentialIds = availableCredentials.map((cred: any) => cred.id)
    await sql`
      UPDATE buyer_credentials_inventory
      SET assigned_to_buyer_id = ${buyerId}, assigned_at = NOW()
      WHERE id = ANY(${credentialIds})
    `

    // Create order credentials records
    for (const cred of availableCredentials) {
      await sql`
        INSERT INTO order_credentials (order_id, credential_id, created_at)
        VALUES (${orderId}, ${cred.id}, NOW())
      `
    }

    console.log(`Assigned ${quantity} credentials to buyer ${buyerId} for order ${orderId}`)
  } catch (error) {
    console.error('Error assigning credentials:', error)
    throw new ValidationError('Failed to assign credentials to buyer')
  }
}

interface InitializePaymentRequest {
  orderId: string
  amount: number
  currency: string
  email: string
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

    const body = await request.json()
    const { orderId, amount, currency, email } = body as InitializePaymentRequest

    // Validate required fields
    if (!orderId || !amount || !currency || !email) {
      throw new ValidationError(
        'Missing required fields: orderId, amount, currency, email'
      )
    }

    if (amount <= 0) {
      throw new ValidationError('Amount must be greater than 0')
    }

    const sql = getDb()

    // Verify order exists and belongs to buyer
    const orders = await sql`
      SELECT id, buyer_id, payment_status, payment_reference_id 
      FROM orders 
      WHERE id = ${orderId} AND buyer_id = ${buyer.id}
    `

    if (orders.length === 0) {
      throw new ValidationError('Order not found or does not belong to this buyer')
    }

    const order = orders[0]

    // Get payment method for this order
    const orderPaymentMethod = await sql`
      SELECT pm.type, pm.name FROM payment_methods pm
      JOIN orders o ON o.payment_method_id = pm.id
      WHERE o.id = ${orderId}
    `

    if (orderPaymentMethod.length === 0) {
      throw new ValidationError('Payment method not found for order')
    }

    const paymentMethodType = orderPaymentMethod[0].type

    // Handle Korapay as balance top-up
    if (paymentMethodType === 'korapay') {
      // For Korapay, we'll simulate a successful payment that adds to balance
      // In a real implementation, this would integrate with actual Korapay payment processing

      // Add amount to buyer balance
      await sql`
        UPDATE buyers SET balance = balance + ${amount} WHERE id = ${buyer.id}
      `

      // Create deposit record
      await sql`
        INSERT INTO deposits (buyer_id, amount, reference_id, status, created_at)
        VALUES (${buyer.id}, ${amount}, ${korapayReference}, 'completed', NOW())
      `

      // Update order status to completed
      await sql`
        UPDATE orders
        SET payment_status = ${PaymentStatus.COMPLETED},
            payment_completed_at = NOW(),
            payment_amount = ${amount},
            payment_currency = ${currency},
            status = 'completed'
        WHERE id = ${orderId}
      `

      // Assign credentials to buyer
      const orderDetails = await sql`
        SELECT product_id, quantity FROM orders WHERE id = ${orderId}
      `

      if (orderDetails.length > 0) {
        const { product_id, quantity } = orderDetails[0]
        await assignCredentialsToBuyer(sql, orderId, buyer.id, product_id, quantity)
      }

      return NextResponse.json({
        success: true,
        message: 'Balance topped up successfully',
        new_balance: amount, // In real app, fetch actual balance
        order_id: orderId,
      })
    }

    // Handle other payment methods (like Dashboard - but Dashboard is handled in checkout)
    // Initialize Korapay payment
    const korapayReference = order.payment_reference_id || `ORD-${orderId}-${Date.now()}`

    try {
      const korapayResponse = await fetch(
        `${config.korapayCheckoutUrl}/charges/initialize`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.korapayApiKeySecret}`,
          },
          body: JSON.stringify({
            amount: Math.round(amount * 100), // Convert to cents
            currency: currency.toUpperCase(),
            reference: korapayReference,
            customer: {
              email: email,
              name: buyer.name || 'Customer',
            },
            metadata: {
              order_id: orderId,
              buyer_id: buyer.id,
            },
            notification_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/korapay`,
          }),
        }
      )

      if (!korapayResponse.ok) {
        const errorData = await korapayResponse.json()
        console.error('[Payment] Korapay API error:', errorData)
        throw new PaymentAPIError(
          `Korapay error: ${errorData.message || 'Unknown error'}`,
          korapayResponse.status
        )
      }

      const korapayData = await korapayResponse.json()

      // Update order with payment reference if not already set
      if (!order.payment_reference_id) {
        await sql`
          UPDATE orders 
          SET payment_reference_id = ${korapayReference}
          WHERE id = ${orderId}
        `
      }

      return NextResponse.json({
        success: true,
        checkout_url: korapayData.data?.checkout_url || korapayData.checkout_url,
        reference: korapayReference,
        order_id: orderId,
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
    const orderId = url.searchParams.get('order_id')

    if (!orderId) {
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
