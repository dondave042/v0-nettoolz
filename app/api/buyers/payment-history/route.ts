import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getDb } from '@/lib/db'

/**
 * GET /api/buyers/payment-history
 * Returns payment history for the authenticated buyer
 */
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const buyerId = cookieStore.get('buyer_id')?.value

    if (!buyerId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status')

    const sql = getDb()
    const buyerIdInt = parseInt(buyerId)

    // Build history query with optional status filter
    let historyQuery
    if (status) {
      historyQuery = await sql`
        SELECT
          o.id as order_id,
          o.buyer_id,
          o.product_id,
          o.quantity,
          o.total_price,
          o.payment_status,
          o.payment_method_type,
          upm.display_name as payment_method_name,
          o.payment_confirmed_at,
          o.created_at,
          p.name as product_name,
          p.sku as product_sku
        FROM orders o
        LEFT JOIN user_payment_methods upm ON o.user_payment_method_id = upm.id
        LEFT JOIN products p ON o.product_id = p.id
        WHERE o.buyer_id = ${buyerIdInt} AND o.payment_status = ${status}
        ORDER BY o.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      historyQuery = await sql`
        SELECT
          o.id as order_id,
          o.buyer_id,
          o.product_id,
          o.quantity,
          o.total_price,
          o.payment_status,
          o.payment_method_type,
          upm.display_name as payment_method_name,
          o.payment_confirmed_at,
          o.created_at,
          p.name as product_name,
          p.sku as product_sku
        FROM orders o
        LEFT JOIN user_payment_methods upm ON o.user_payment_method_id = upm.id
        LEFT JOIN products p ON o.product_id = p.id
        WHERE o.buyer_id = ${buyerIdInt}
        ORDER BY o.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    }

    // Get total count
    let countResult
    if (status) {
      countResult = await sql`
        SELECT COUNT(*) as total FROM orders
        WHERE buyer_id = ${buyerIdInt} AND payment_status = ${status}
      `
    } else {
      countResult = await sql`
        SELECT COUNT(*) as total FROM orders
        WHERE buyer_id = ${buyerIdInt}
      `
    }

    const total = countResult[0].total

    return NextResponse.json(
      {
        success: true,
        history: historyQuery || [],
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[PaymentHistory] GET Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment history' },
      { status: 500 }
    )
  }
}
