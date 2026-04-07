import { NextResponse } from 'next/server'
import { getBuyerSession } from '@/lib/buyer-auth'
import { getDb } from '@/lib/db'

export async function GET() {
  try {
    const buyer = await getBuyerSession()

    if (!buyer) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const sql = getDb()
    const results = await sql`
      SELECT
        COUNT(*)::int AS total_orders,
        COUNT(CASE WHEN payment_status = 'pending' THEN 1 END)::int AS pending_orders,
        COALESCE(SUM(CASE WHEN payment_status = 'completed' THEN total_price ELSE 0 END), 0)::numeric AS total_spent
      FROM orders
      WHERE buyer_id = ${buyer.id}
    `

    const stats = results[0] || {
      total_orders: 0,
      pending_orders: 0,
      total_spent: 0,
    }

    return NextResponse.json({
      totalOrders: stats.total_orders,
      pendingOrders: stats.pending_orders,
      totalSpent: parseFloat(stats.total_spent ?? 0),
      wishlistItems: 0,
    })
  } catch (error) {
    console.error('Buyer stats error:', error)
    return NextResponse.json(
      { error: 'Failed to load buyer stats' },
      { status: 500 }
    )
  }
}
