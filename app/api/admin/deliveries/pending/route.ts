import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { cookies } from 'next/headers'

/**
 * GET /api/admin/deliveries/pending
 * Get all pending product deliveries (completed payments not yet delivered)
 */
export async function GET(request: Request) {
  try {
    // Verify admin authentication
    const cookieStore = await cookies()
    const adminEmail = cookieStore.get('admin_email')?.value

    if (!adminEmail) {
      return NextResponse.json(
        { error: 'Admin not authenticated' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search')

    const sql = getDb()

    let pendingDeliveries

    if (search) {
      pendingDeliveries = await sql`
        SELECT
          o.id as order_id,
          o.buyer_id,
          o.product_id,
          o.total_price,
          o.payment_status,
          o.payment_confirmed_at,
          b.email as buyer_email,
          b.full_name as buyer_name,
          p.name as product_name,
          p.sku as product_sku,
          o.quantity,
          o.created_at as order_date
        FROM orders o
        JOIN buyers b ON o.buyer_id = b.id
        JOIN products p ON o.product_id = p.id
        WHERE o.payment_status = 'completed'
          AND o.is_delivered = false
          AND (b.email ILIKE ${'%' + search + '%'}
            OR b.full_name ILIKE ${'%' + search + '%'}
            OR p.name ILIKE ${'%' + search + '%'})
        ORDER BY o.payment_confirmed_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      pendingDeliveries = await sql`
        SELECT
          o.id as order_id,
          o.buyer_id,
          o.product_id,
          o.total_price,
          o.payment_status,
          o.payment_confirmed_at,
          b.email as buyer_email,
          b.full_name as buyer_name,
          p.name as product_name,
          p.sku as product_sku,
          o.quantity,
          o.created_at as order_date
        FROM orders o
        JOIN buyers b ON o.buyer_id = b.id
        JOIN products p ON o.product_id = p.id
        WHERE o.payment_status = 'completed' AND o.is_delivered = false
        ORDER BY o.payment_confirmed_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    }

    // Get total count
    const countResult = await sql`
      SELECT COUNT(*)::int as total FROM orders o
      JOIN buyers b ON o.buyer_id = b.id
      JOIN products p ON o.product_id = p.id
      WHERE o.payment_status = 'completed' AND o.is_delivered = false
    `

    return NextResponse.json(
      {
        success: true,
        deliveries: pendingDeliveries || [],
        pagination: {
          total: countResult[0].total,
          limit,
          offset,
          hasMore: offset + limit < countResult[0].total,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[AdminDeliveries] GET Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pending deliveries' },
      { status: 500 }
    )
  }
}
