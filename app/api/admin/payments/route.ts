import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { getDb } from '@/lib/db'

interface PaymentTransaction {
  id: number
  order_id: number
  buyer_id: number | null
  buyer_email: string | null
  buyer_name: string | null
  product_id: number
  product_name: string | null
  quantity: number
  total_price: string
  payment_status: string
  payment_method_type: string | null
  payment_reference_id: string | null
  created_at: string
  payment_confirmed_at: string | null
  payment_failure_reason: string | null
}

interface PaymentsResponse {
  success: boolean
  transactions: PaymentTransaction[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

/**
 * GET /api/admin/payments
 * Fetches all payment transactions with filtering, sorting, and pagination
 * Query parameters:
 * - page: number (default: 1)
 * - per_page: number (default: 20, max: 100)
 * - status: pending|completed|failed|cancelled
 * - search: search by order ID or buyer email
 * - date_from: ISO date string
 * - date_to: ISO date string
 * - sort: created_at|total_price|payment_status (default: created_at)
 * - order: asc|desc (default: desc)
 */
export async function GET(request: NextRequest) {
  const admin = await getAdminSession()

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const url = new URL(request.url)
    
    // Pagination parameters
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
    const per_page = Math.min(100, Math.max(1, parseInt(url.searchParams.get('per_page') || '20')))
    const offset = (page - 1) * per_page

    // Filter parameters
    const status = url.searchParams.get('status')
    const search = url.searchParams.get('search')
    const date_from = url.searchParams.get('date_from')
    const date_to = url.searchParams.get('date_to')

    // Sort parameters
    const sort = url.searchParams.get('sort') || 'created_at'
    const order = (url.searchParams.get('order') || 'desc').toUpperCase()

    // Validate sort field
    const validSortFields = ['created_at', 'total_price', 'payment_status']
    if (!validSortFields.includes(sort)) {
      return NextResponse.json(
        { error: 'Invalid sort field' },
        { status: 400 }
      )
    }

    const sql = getDb()

    // Build the WHERE clause
    let whereConditions: string[] = []
    const params: (string | number | boolean)[] = []

    if (status) {
      whereConditions.push('o.payment_status = $' + (params.length + 1))
      params.push(status)
    }

    if (date_from) {
      whereConditions.push('o.created_at >= $' + (params.length + 1))
      params.push(date_from)
    }

    if (date_to) {
      whereConditions.push('o.created_at <= $' + (params.length + 1))
      params.push(date_to)
    }

    if (search) {
      whereConditions.push(
        `(CAST(o.id AS TEXT) ILIKE $${params.length + 1} OR b.email ILIKE $${params.length + 1})`
      )
      params.push(`%${search}%`)
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : ''

    // Query to get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM orders o
      LEFT JOIN buyers b ON o.buyer_id = b.id
      LEFT JOIN products p ON o.product_id = p.id
      ${whereClause}
    `

    // Query to get paginated results
    const dataQuery = `
      SELECT
        o.id,
        o.id as order_id,
        o.buyer_id,
        b.email as buyer_email,
        b.full_name as buyer_name,
        o.product_id,
        p.name as product_name,
        o.quantity,
        o.total_price,
        o.payment_status,
        o.payment_method_type,
        o.payment_reference_id,
        o.created_at,
        o.payment_confirmed_at,
        o.payment_failure_reason
      FROM orders o
      LEFT JOIN buyers b ON o.buyer_id = b.id
      LEFT JOIN products p ON o.product_id = p.id
      ${whereClause}
      ORDER BY o.${sort} ${order}
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
    `

    const countResult = await sql(countQuery, params)
    const total = countResult[0]?.total || 0

    const dataParams = [...params, per_page, offset]
    const transactions = await sql(dataQuery, dataParams)

    const total_pages = Math.ceil(total / per_page)

    console.log(`[Admin Payments API] Fetched ${transactions.length} transactions (page ${page}/${total_pages})`)

    return NextResponse.json({
      success: true,
      transactions: transactions || [],
      total,
      page,
      per_page,
      total_pages,
    } as PaymentsResponse)
  } catch (error) {
    console.error('[Admin Payments API] Error fetching payments:', error)

    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/payments/stats
 * Fetches payment statistics (revenue, transaction count, etc)
 */
export async function HEAD(request: NextRequest) {
  const admin = await getAdminSession()

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const sql = getDb()

    const stats = await sql`
      SELECT
        COUNT(*) as total_transactions,
        SUM(CASE WHEN payment_status = 'completed' THEN total_price ELSE 0 END)::DECIMAL as total_revenue,
        COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN payment_status = 'failed' THEN 1 END) as failed_count,
        COUNT(CASE WHEN payment_status = 'completed' THEN 1 END) as completed_count,
        COALESCE(SUM(CASE WHEN payment_status = 'pending' THEN total_price ELSE 0 END), 0)::DECIMAL as pending_amount
      FROM orders
    `

    return NextResponse.json({
      success: true,
      stats: stats[0] || {},
    })
  } catch (error) {
    console.error('[Admin Payments Stats API] Error:', error)

    return NextResponse.json(
      { error: 'Failed to fetch payment stats' },
      { status: 500 }
    )
  }
}
