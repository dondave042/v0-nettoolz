import { NextResponse } from 'next/server'
import { getBuyerSession } from '@/lib/buyer-auth'
import { ensureBalanceAdjustmentsTable } from '@/lib/balance-adjustments'
import { getDb } from '@/lib/db'

export async function GET() {
  const buyer = await getBuyerSession()

  if (!buyer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const sql = getDb()
    await ensureBalanceAdjustmentsTable()

    const [summary] = await sql`
      SELECT
        b.id,
        b.full_name,
        b.balance,
        COUNT(o.id)::int AS total_orders,
        COUNT(CASE WHEN o.payment_status = 'pending' THEN 1 END)::int AS pending_orders,
        COALESCE(SUM(CASE WHEN o.payment_status = 'completed' THEN o.total_price ELSE 0 END), 0) AS total_spent,
        MAX(o.payment_completed_at) AS last_purchase_success_at,
        (
          SELECT MAX(d.created_at)
          FROM deposits d
          WHERE d.buyer_id = b.id AND d.status = 'completed'
        ) AS last_deposit_success_at
      FROM buyers b
      LEFT JOIN orders o ON o.buyer_id = b.id
      WHERE b.id = ${buyer.id}
      GROUP BY b.id, b.full_name, b.balance
    `

    const recentOrders = await sql`
      SELECT
        o.id,
        p.name AS product_name,
        o.quantity,
        o.total_price,
        o.payment_status,
        pm.name AS payment_method_name,
        o.created_at
      FROM orders o
      LEFT JOIN products p ON p.id = o.product_id
      LEFT JOIN payment_methods pm ON pm.id = o.payment_method_id
      WHERE o.buyer_id = ${buyer.id}
      ORDER BY o.created_at DESC
      LIMIT 5
    `

    const recentActivity = await sql`
      SELECT *
      FROM (
        SELECT
          CONCAT('deposit-', d.id) AS id,
          CASE WHEN d.amount >= 0 THEN 'credit' ELSE 'debit' END AS direction,
          ABS(d.amount) AS amount,
          d.status,
          d.reference_id,
          CASE
            WHEN d.reference_id LIKE 'WELCOME-BONUS-%' THEN 'Welcome bonus'
            ELSE 'Balance top-up'
          END AS title,
          CASE
            WHEN d.reference_id LIKE 'WELCOME-BONUS-%' THEN 'welcome_bonus'
            ELSE 'deposit'
          END AS type,
          d.created_at AS occurred_at
        FROM deposits d
        WHERE d.buyer_id = ${buyer.id}

        UNION ALL

        SELECT
          CONCAT('adjustment-', a.id) AS id,
          CASE WHEN a.amount >= 0 THEN 'credit' ELSE 'debit' END AS direction,
          ABS(a.amount) AS amount,
          'completed' AS status,
          a.admin_email AS reference_id,
          COALESCE(NULLIF(a.reason, ''), 'Manual balance adjustment') AS title,
          'manual_adjustment' AS type,
          a.created_at AS occurred_at
        FROM balance_adjustments a
        WHERE a.buyer_id = ${buyer.id}

        UNION ALL

        SELECT
          CONCAT('order-', o.id) AS id,
          'debit' AS direction,
          o.total_price AS amount,
          o.payment_status AS status,
          o.payment_reference_id AS reference_id,
          COALESCE(p.name, 'Purchase deduction') AS title,
          'purchase' AS type,
          COALESCE(o.payment_completed_at, o.created_at) AS occurred_at
        FROM orders o
        LEFT JOIN products p ON p.id = o.product_id
        WHERE o.buyer_id = ${buyer.id}
          AND o.payment_status = 'completed'
      ) activity
      ORDER BY occurred_at DESC
      LIMIT 5
    `

    return NextResponse.json({
      buyer: {
        id: summary?.id,
        name: summary?.full_name,
        balance: Number(summary?.balance ?? 0),
      },
      stats: {
        balance: Number(summary?.balance ?? 0),
        totalOrders: Number(summary?.total_orders ?? 0),
        pendingOrders: Number(summary?.pending_orders ?? 0),
        totalSpent: Number(summary?.total_spent ?? 0),
      },
      events: {
        lastPurchaseSuccessAt: summary?.last_purchase_success_at ?? null,
        lastDepositSuccessAt: summary?.last_deposit_success_at ?? null,
      },
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        product_name: order.product_name,
        quantity: Number(order.quantity ?? 0),
        total_price: String(order.total_price ?? '0'),
        payment_status: order.payment_status,
        payment_method_name: order.payment_method_name,
        created_at: order.created_at,
      })),
      recentActivity: recentActivity.map((entry) => ({
        id: entry.id,
        direction: entry.direction,
        amount: Number(entry.amount ?? 0),
        status: entry.status,
        reference_id: entry.reference_id,
        title: entry.title,
        type: entry.type,
        occurred_at: entry.occurred_at,
      })),
      serverTime: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Dashboard Summary] Failed to fetch summary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard summary' },
      { status: 500 }
    )
  }
}
