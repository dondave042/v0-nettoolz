import { NextResponse } from 'next/server'
import { getBuyerSession } from '@/lib/buyer-auth'
import { getDb } from '@/lib/db'
import { getPaymentConfig } from '@/lib/payment-config'
import { PaymentStatus } from '@/lib/payment-status'
import {
  PaymentConfigError,
  CheckoutError,
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
      throw new CheckoutError(`Only ${availableCredentials.length} credentials available, requested ${quantity}`)
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
    throw new CheckoutError('Failed to assign credentials to buyer')
  }
}

export async function POST(request: Request) {
  const buyer = await getBuyerSession()

  if (!buyer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Validate payment configuration
    try {
      const config = getPaymentConfig()
      console.log('[Checkout] Payment configuration validated')
    } catch (error) {
      console.error('[Checkout] Payment configuration is invalid:', error)
      throw new PaymentConfigError(
        'Payment system is not properly configured'
      )
    }

    const { product_id, quantity, payment_method_id } = await request.json()

    if (!product_id || !quantity || !payment_method_id) {
      return NextResponse.json(
        { error: 'Missing required fields: product_id, quantity, payment_method_id' },
        { status: 400 }
      )
    }

    if (quantity < 1 || !Number.isInteger(quantity)) {
      throw new ValidationError('Quantity must be a positive integer')
    }

    const sql = getDb()

    // Get product details
    const products = await sql`
      SELECT id, name, price, available_qty FROM products WHERE id = ${product_id}
    `

    if (products.length === 0) {
      throw new ValidationError('Product not found')
    }

    const product = products[0]

    // Check available quantity
    if (product.available_qty < quantity) {
      throw new ValidationError(
        `Not enough inventory. Available: ${product.available_qty}, Requested: ${quantity}`
      )
    }

    // Check available credentials
    const credentialCount = await sql`
      SELECT COUNT(*) as count FROM buyer_credentials_inventory 
      WHERE product_id = ${product_id} AND assigned_to_buyer_id IS NULL
    `

    if (credentialCount[0].count < quantity) {
      throw new ValidationError(
        `Not enough credentials available. Available: ${credentialCount[0].count}, Requested: ${quantity}`
      )
    }

    // Get payment method
    const methods = await sql`
      SELECT id, name, type FROM payment_methods WHERE id = ${payment_method_id} AND is_active = true
    `

    if (methods.length === 0) {
      throw new ValidationError('Invalid or inactive payment method')
    }

    const paymentMethod = methods[0]
    const total_price = parseFloat(product.price) * quantity
    const paymentReference = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Handle Dashboard payment method (balance payment)
    if (paymentMethod.type === 'dashboard') {
      // Check buyer balance
      const buyerBalance = await sql`
        SELECT balance FROM buyers WHERE id = ${buyer.id}
      `

      if (buyerBalance.length === 0) {
        throw new ValidationError('Buyer not found')
      }

      const balance = parseFloat(buyerBalance[0].balance || 0)

      if (balance < total_price) {
        throw new ValidationError(
          `Insufficient balance. Available: ₦${balance.toLocaleString()}, Required: ₦${total_price.toLocaleString()}`
        )
      }

      // Deduct from balance and create order as completed
      await sql`
        UPDATE buyers SET balance = balance - ${total_price} WHERE id = ${buyer.id}
      `

      // Create order as completed
      const orders = await sql`
        INSERT INTO orders (
          buyer_id,
          product_id,
          quantity,
          total_price,
          payment_method_id,
          status,
          payment_status,
          payment_reference_id,
          buyer_email,
          created_at
        )
        VALUES (
          ${buyer.id},
          ${product_id},
          ${quantity},
          ${total_price},
          ${payment_method_id},
          'completed',
          ${PaymentStatus.COMPLETED},
          ${paymentReference},
          ${buyer.email || ''},
          NOW()
        )
        RETURNING
          id,
          buyer_id,
          product_id,
          quantity,
          total_price,
          payment_method_id,
          status,
          payment_status,
          payment_reference_id,
          created_at
      `

      if (!orders || orders.length === 0) {
        throw new CheckoutError('Failed to create order in database')
      }

      const order = orders[0]

      // Assign credentials to buyer
      await assignCredentialsToBuyer(sql, order.id, buyer.id, product_id, quantity)

      return NextResponse.json(
        {
          order: {
            id: order.id,
            product_id: order.product_id,
            quantity: order.quantity,
            total_price: order.total_price,
            payment_method_id: order.payment_method_id,
            status: order.status,
            payment_status: order.payment_status,
            payment_reference_id: order.payment_reference_id,
            created_at: order.created_at,
          },
          message: 'Payment completed successfully using account balance',
        },
        { status: 201 }
      )
    }

    // Handle other payment methods (like Korapay)
    // Create order with payment tracking
    const orders = await sql`
      INSERT INTO orders (
        buyer_id, 
        product_id, 
        quantity, 
        total_price, 
        payment_method_id, 
        status,
        payment_status,
        payment_reference_id,
        buyer_email,
        created_at
      )
      VALUES (
        ${buyer.id}, 
        ${product_id}, 
        ${quantity}, 
        ${total_price}, 
        ${payment_method_id}, 
        'pending',
        ${PaymentStatus.PENDING},
        ${paymentReference},
        ${buyer.email || ''},
        NOW()
      )
      RETURNING 
        id, 
        buyer_id, 
        product_id, 
        quantity, 
        total_price, 
        payment_method_id,
        status,
        payment_status,
        payment_reference_id,
        created_at
    `

    if (!orders || orders.length === 0) {
      throw new CheckoutError('Failed to create order in database')
    }

    const order = orders[0]

    return NextResponse.json(
      {
        order: {
          id: order.id,
          product_id: order.product_id,
          quantity: order.quantity,
          total_price: order.total_price,
          payment_method_id: order.payment_method_id,
          status: order.status,
          payment_status: order.payment_status,
          payment_reference_id: order.payment_reference_id,
          created_at: order.created_at,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Checkout] Error creating order:', error)

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    if (error instanceof PaymentConfigError) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    if (error instanceof CheckoutError) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  const buyer = await getBuyerSession()

  if (!buyer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const sql = getDb()

    // Get buyer's orders
    const orders = await sql`
      SELECT 
        o.id, o.product_id, o.quantity, o.total_price, o.status, 
        o.payment_method_id, o.created_at,
        p.name as product_name, p.price,
        pm.name as payment_method_name
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN payment_methods pm ON o.payment_method_id = pm.id
      WHERE o.buyer_id = ${buyer.id}
      ORDER BY o.created_at DESC
    `

    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Get orders error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}
