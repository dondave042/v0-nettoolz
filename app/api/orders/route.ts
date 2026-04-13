import { NextRequest, NextResponse } from 'next/server'
import { getBuyerSession } from '@/lib/buyer-auth'
import { getDb } from '@/lib/db'

/**
 * GET /api/orders
 * Fetches all orders for the authenticated buyer with product and payment details
 * Returns orders with payment status, methods, and credential count
 */
export async function GET(request: NextRequest) {
  const buyer = await getBuyerSession()

  if (!buyer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const sql = getDb()

    // Fetch orders with product and payment method details
    const orders = await sql`
      SELECT
        o.id,
        o.buyer_id,
        o.product_id,
        p.name as product_name,
        o.quantity,
        o.total_price,
        o.payment_status,
        o.status as order_status,
        pm.name as payment_method_name,
        o.payment_reference_id,
        o.created_at,
        o.updated_at,
        o.payment_completed_at,
        COUNT(oc.id) as credential_count
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      LEFT JOIN payment_methods pm ON o.payment_method_id = pm.id
      LEFT JOIN order_credentials oc ON o.id = oc.order_id
      WHERE o.buyer_id = ${buyer.id}
      GROUP BY o.id, p.id, pm.id
      ORDER BY o.created_at DESC
    `

    return NextResponse.json({
      orders: orders.map(order => ({
        id: order.id,
        product_name: order.product_name,
        quantity: order.quantity,
        total_price: order.total_price,
        payment_status: order.payment_status,
        order_status: order.order_status,
        payment_method_name: order.payment_method_name,
        payment_reference_id: order.payment_reference_id,
        credential_count: Number(order.credential_count),
        created_at: order.created_at,
        updated_at: order.updated_at,
        payment_completed_at: order.payment_completed_at,
      })),
      total: orders.length,
    })
  } catch (error) {
    console.error('[Orders] Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}
