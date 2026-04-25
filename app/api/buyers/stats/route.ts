import { NextResponse } from 'next/server'
import { getBuyerSession } from '@/lib/buyer-auth'
import { getDb } from '@/lib/db'

export async function GET() {
  const buyer = await getBuyerSession()

  if (!buyer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const sql = getDb()

    const [row] = await sql`
      SELECT
        b.balance,
        COUNT(o.id)::int as total_orders,
        COUNT(CASE WHEN o.payment_status = 'pending' THEN 1 END)::int as pending_orders,
        COALESCE(SUM(CASE WHEN o.payment_status = 'completed' THEN o.total_price ELSE 0 END), 0) as total_spent
      FROM buyers b
      LEFT JOIN orders o ON o.buyer_id = b.id
      WHERE b.id = ${buyer.id}
      GROUP BY b.balance
    `

    return NextResponse.json({
      balance: parseFloat(row?.balance ?? '0'),
      totalOrders: row?.total_orders ?? 0,
      pendingOrders: row?.pending_orders ?? 0,
      totalSpent: parseFloat(row?.total_spent ?? '0'),
      wishlistItems: 0,
    })
  } catch (error) {
    console.error('Buyer stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
