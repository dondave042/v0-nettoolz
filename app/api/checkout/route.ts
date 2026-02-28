import { NextResponse } from 'next/server'
import { getBuyerSession } from '@/lib/buyer-auth'
import { getDb } from '@/lib/db'

export async function POST(request: Request) {
  const buyer = await getBuyerSession()

  if (!buyer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { product_id, quantity, payment_method_id } = await request.json()

    if (!product_id || !quantity || !payment_method_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const sql = getDb()

    // Get product details
    const products = await sql`
      SELECT id, name, price, available_qty FROM products WHERE id = ${product_id}
    `

    if (products.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const product = products[0]

    // Check available quantity
    if (product.available_qty < quantity) {
      return NextResponse.json(
        { error: 'Not enough inventory' },
        { status: 400 }
      )
    }

    // Check available credentials
    const credentialCount = await sql`
      SELECT COUNT(*) as count FROM buyer_credentials_inventory 
      WHERE product_id = ${product_id} AND assigned_to_buyer_id IS NULL
    `

    if (credentialCount[0].count < quantity) {
      return NextResponse.json(
        { error: 'Not enough credentials available for this quantity' },
        { status: 400 }
      )
    }

    // Get payment method
    const methods = await sql`
      SELECT id, name FROM payment_methods WHERE id = ${payment_method_id} AND is_active = true
    `

    if (methods.length === 0) {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      )
    }

    const total_price = parseFloat(product.price) * quantity

    // Create order
    const orders = await sql`
      INSERT INTO orders (buyer_id, product_id, quantity, total_price, payment_method_id, status)
      VALUES (${buyer.id}, ${product_id}, ${quantity}, ${total_price}, ${payment_method_id}, 'pending')
      RETURNING id, buyer_id, product_id, quantity, total_price, payment_method_id, status, created_at
    `

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
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Checkout error:', error)
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
