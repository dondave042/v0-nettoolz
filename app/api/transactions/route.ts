import { NextRequest, NextResponse } from 'next/server'
import { ensureBalanceAdjustmentsTable } from '@/lib/balance-adjustments'
import { getBuyerSession } from '@/lib/buyer-auth'
import { getDb } from '@/lib/db'

export async function GET(request: NextRequest) {
  const buyer = await getBuyerSession()

  if (!buyer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const url = new URL(request.url)
    const type = url.searchParams.get('type')
    const status = url.searchParams.get('status')
    const dateFrom = url.searchParams.get('date_from')
    const dateTo = url.searchParams.get('date_to')
    const sql = getDb()
    await ensureBalanceAdjustmentsTable()
    const params: Array<string | number> = [buyer.id]
    const filters: string[] = []

    if (type && type !== 'all') {
      filters.push(`transactions.type = $${params.length + 1}`)
      params.push(type)
    }

    if (status && status !== 'all') {
      filters.push(`transactions.status = $${params.length + 1}`)
      params.push(status)
    }

    if (dateFrom) {
      filters.push(`transactions.occurred_at >= $${params.length + 1}`)
      params.push(dateFrom)
    }

    if (dateTo) {
      filters.push(`transactions.occurred_at < ($${params.length + 1}::date + INTERVAL '1 day')`)
      params.push(dateTo)
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : ''
    const query = `
      SELECT *
      FROM (
        SELECT
          CONCAT('deposit-', d.id) AS id,
          CASE WHEN d.amount >= 0 THEN 'credit' ELSE 'debit' END AS direction,
          CASE
            WHEN d.reference_id LIKE 'WELCOME-BONUS-%' THEN 'welcome_bonus'
            ELSE 'deposit'
          END AS type,
          CASE
            WHEN d.reference_id LIKE 'WELCOME-BONUS-%' THEN 'Welcome bonus'
            ELSE 'Balance top-up'
          END AS title,
          ABS(d.amount) AS amount,
          d.status,
          d.reference_id,
          NULL::INT AS order_id,
          NULL::TEXT AS product_name,
          d.created_at AS occurred_at
        FROM deposits d
        WHERE d.buyer_id = $1

        UNION ALL

        SELECT
          CONCAT('adjustment-', a.id) AS id,
          CASE WHEN a.amount >= 0 THEN 'credit' ELSE 'debit' END AS direction,
          'manual_adjustment' AS type,
          COALESCE(NULLIF(a.reason, ''), 'Manual balance adjustment') AS title,
          ABS(a.amount) AS amount,
          'completed' AS status,
          a.admin_email AS reference_id,
          NULL::INT AS order_id,
          NULL::TEXT AS product_name,
          a.created_at AS occurred_at
        FROM balance_adjustments a
        WHERE a.buyer_id = $1

        UNION ALL

        SELECT
          CONCAT('order-', o.id) AS id,
          'debit' AS direction,
          'purchase' AS type,
          COALESCE(p.name, 'Purchase deduction') AS title,
          o.total_price AS amount,
          o.payment_status AS status,
          o.payment_reference_id AS reference_id,
          o.id AS order_id,
          p.name AS product_name,
          COALESCE(o.payment_completed_at, o.created_at) AS occurred_at
        FROM orders o
        LEFT JOIN payment_methods pm ON o.payment_method_id = pm.id
        LEFT JOIN products p ON o.product_id = p.id
        WHERE o.buyer_id = $1
          AND o.payment_status = 'completed'
          AND COALESCE(pm.type, '') = 'balance'
      ) AS transactions
      ${whereClause}
      ORDER BY occurred_at DESC
      LIMIT 100
    `
    const transactions = await sql(query, params)

    return NextResponse.json({
      transactions: transactions.map((row) => ({
        id: row.id,
        direction: row.direction,
        type: row.type,
        title: row.title,
        amount: parseFloat(row.amount ?? 0),
        status: row.status,
        reference_id: row.reference_id,
        order_id: row.order_id,
        product_name: row.product_name,
        occurred_at: row.occurred_at,
      })),
    })
  } catch (error) {
    console.error('[Transactions] Failed to fetch transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}