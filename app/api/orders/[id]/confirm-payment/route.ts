import { NextResponse } from 'next/server'
import { getBuyerSession } from '@/lib/buyer-auth'
import { getDb } from '@/lib/db'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const buyer = await getBuyerSession()

  if (!buyer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const order_id = parseInt(params.id)
    const sql = getDb()

    // Get order details
    const orders = await sql`
      SELECT id, buyer_id, product_id, quantity, status 
      FROM orders 
      WHERE id = ${order_id} AND buyer_id = ${buyer.id}
    `

    if (orders.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const order = orders[0]

    if (order.status !== 'pending') {
      return NextResponse.json(
        { error: 'Order is not pending payment' },
        { status: 400 }
      )
    }

    // Get available credentials for this product
    const credentials = await sql`
      SELECT id FROM buyer_credentials_inventory 
      WHERE product_id = ${order.product_id} AND assigned_to_buyer_id IS NULL
      LIMIT ${order.quantity}
    `

    if (credentials.length < order.quantity) {
      return NextResponse.json(
        { error: 'Not enough credentials available' },
        { status: 400 }
      )
    }

    // Assign credentials to buyer
    const credential_ids = credentials.map((c: any) => c.id)

    for (const cred_id of credential_ids) {
      await sql`
        UPDATE buyer_credentials_inventory 
        SET assigned_to_buyer_id = ${buyer.id}
        WHERE id = ${cred_id}
      `
    }

    // Update order status to completed
    await sql`
      UPDATE orders
      SET status = 'completed', payment_completed_at = NOW()
      WHERE id = ${order_id}
    `

    // Update product available quantity
    await sql`
      UPDATE products
      SET available_qty = available_qty - ${order.quantity}
      WHERE id = ${order.product_id}
    `

    return NextResponse.json({
      success: true,
      message: 'Payment confirmed and credentials assigned',
      order_id: order.id,
    })
  } catch (error) {
    console.error('Payment confirmation error:', error)
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    )
  }
}
