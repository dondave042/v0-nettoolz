import { getDb } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getSession as getAdminSession } from './auth'

export async function ensureBalanceAdjustmentsTable() {
  const sql = getDb()

  await sql`
    CREATE TABLE IF NOT EXISTS balance_adjustments (
      id SERIAL PRIMARY KEY,
      buyer_id INT NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
      admin_user_id INT,
      admin_email VARCHAR(255),
      amount DECIMAL(10, 2) NOT NULL,
      reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `

  return sql
}

export async function createBalanceAdjustment(input: {
  buyerId: number
  adminUserId?: number | null
  adminEmail?: string | null
  amount: number
  reason?: string | null
}) {
  const sql = await ensureBalanceAdjustmentsTable()

  const rows = await sql`
    INSERT INTO balance_adjustments (
      buyer_id,
      admin_user_id,
      admin_email,
      amount,
      reason
    )
    VALUES (
      ${input.buyerId},
      ${input.adminUserId ?? null},
      ${input.adminEmail ?? null},
      ${input.amount},
      ${input.reason ?? null}
    )
    RETURNING id, buyer_id, admin_user_id, admin_email, amount, reason, created_at
  `

  return rows[0]
}
export async function GET(request: NextRequest) {
  const admin = await getAdminSession()

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const url = new URL(request.url)
    const pageParam = Number(url.searchParams.get('page') || '1')
    const pageSizeParam = Number(url.searchParams.get('page_size') || '20')
    const search = (url.searchParams.get('search') || '').trim().toLowerCase()

    const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1
    const pageSize = Number.isFinite(pageSizeParam)
      ? Math.min(100, Math.max(1, Math.floor(pageSizeParam)))
      : 20
    const offset = (page - 1) * pageSize

    const sql = await ensureBalanceAdjustmentsTable()
    const params: Array<string | number> = []
    const where: string[] = []

    if (search) {
      where.push(`(LOWER(b.email) LIKE $${params.length + 1} OR LOWER(COALESCE(b.full_name, '')) LIKE $${params.length + 2} OR LOWER(COALESCE(a.admin_email, '')) LIKE $${params.length + 3})`)
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''
    const fromSql = `
      FROM balance_adjustments a
      JOIN buyers b ON b.id = a.buyer_id
      ${whereClause}
    `

    const countRows = await sql.query(`SELECT COUNT(*)::INT AS total ${fromSql}`, params)
    const totalCount = Number(countRows[0]?.total ?? 0)
    const totalPages = totalCount === 0 ? 1 : Math.ceil(totalCount / pageSize)

    const rows = await sql.query(
      `
        SELECT
          a.id,
          a.amount,
          a.reason,
          a.admin_user_id,
          a.admin_email,
          a.created_at,
          b.id AS buyer_id,
          b.full_name AS buyer_name,
          b.email AS buyer_email,
          b.balance AS buyer_balance
        ${fromSql}
        ORDER BY a.created_at DESC
        LIMIT $${params.length + 1}
        OFFSET $${params.length + 2}
      `,
      [...params, pageSize, offset]
    )

    return NextResponse.json({
      adjustments: rows.map((row: Record<string, unknown>) => ({
        id: row.id,
        amount: Number(row.amount ?? 0),
        reason: row.reason,
        admin_user_id: row.admin_user_id,
        admin_email: row.admin_email,
        created_at: row.created_at,
        buyer: {
          id: row.buyer_id,
          name: row.buyer_name,
          email: row.buyer_email,
          balance: Number(row.buyer_balance ?? 0),
        },
      })),
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    })
  } catch (error) {
    console.error('[Admin Balance Adjustments] Failed to fetch adjustments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch balance adjustments' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const admin = await getAdminSession()

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { email, amount, reason } = await request.json()
    const parsedAmount = Number(amount)

    if (!email || !Number.isFinite(parsedAmount) || parsedAmount === 0) {
      return NextResponse.json(
        { error: 'Buyer email and a non-zero amount are required' },
        { status: 400 }
      )
    }

    const sql = getDb()
    const buyers = await sql`
      SELECT id, email, full_name, balance
      FROM buyers
      WHERE email = ${String(email).toLowerCase().trim()}
      LIMIT 1
    `

    if (buyers.length === 0) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })
    }

    const buyer = buyers[0]
    const currentBalance = parseFloat(buyer.balance ?? 0)
    const nextBalance = currentBalance + parsedAmount

    if (nextBalance < 0) {
      return NextResponse.json(
        { error: 'Adjustment would reduce buyer balance below zero' },
        { status: 400 }
      )
    }

    await sql`
      UPDATE buyers
      SET balance = ${nextBalance}, updated_at = NOW()
      WHERE id = ${buyer.id}
    `

    const adjustment = await createBalanceAdjustment({
      buyerId: buyer.id,
      adminUserId: admin.id,
      adminEmail: admin.email,
      amount: parsedAmount,
      reason: reason || null,
    })

    return NextResponse.json({
      success: true,
      buyer: {
        id: buyer.id,
        email: buyer.email,
        name: buyer.full_name,
        balance: nextBalance,
      },
      adjustment,
    })
  } catch (error) {
    console.error('[Admin Balance Adjustments] Failed to create adjustment:', error)
    return NextResponse.json(
      { error: 'Failed to create balance adjustment' },
      { status: 500 }
    )
  }
}
