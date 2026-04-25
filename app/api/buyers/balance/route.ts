import { NextRequest, NextResponse } from 'next/server'
import { getBuyerSession } from '@/lib/buyer-auth'
import { getDb } from '@/lib/db'

/**
 * GET /api/buyers/balance
 * Fetches the current buyer balance and recent payment webhooks
 * Used by dashboard for real-time updates after Korapay payments
 */
export async function GET(request: NextRequest) {
  const buyer = await getBuyerSession()

  if (!buyer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const sql = getDb()

    // Get buyer's current balance
    const buyerData = await sql`
      SELECT id, email, full_name, balance, updated_at
      FROM buyers
      WHERE id = ${buyer.id}
    `

    if (buyerData.length === 0) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })
    }

    const buyerRecord = buyerData[0]

    // Get recent completed orders (last 10 minutes) for webhook updates
    const recentOrders = await sql`
      SELECT
        o.id,
        o.payment_status,
        o.payment_completed_at,
        o.updated_at,
        p.name as product_name,
        o.total_price
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      WHERE o.buyer_id = ${buyer.id}
        AND o.payment_status = 'completed'
        AND o.payment_completed_at > NOW() - INTERVAL '10 minutes'
      ORDER BY o.payment_completed_at DESC
      LIMIT 5
    `

    return NextResponse.json({
      buyer: {
        id: buyerRecord.id,
        email: buyerRecord.email,
        name: buyerRecord.full_name,
        balance: parseFloat(buyerRecord.balance),
        updated_at: buyerRecord.updated_at,
      },
      recentCompletedOrders: recentOrders.map(order => ({
        id: order.id,
        product_name: order.product_name,
        total_price: parseFloat(order.total_price),
        payment_completed_at: order.payment_completed_at,
      })),
    })
  } catch (error) {
    console.error('[Balance] Error fetching balance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch balance' },
      { status: 500 }
    )
  }
}
