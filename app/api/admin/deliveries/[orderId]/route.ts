import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { cookies } from 'next/headers'

/**
 * POST /api/admin/deliveries/[orderId]/deliver
 * Mark a product as delivered to a buyer
 */
export async function POST(
  request: Request,
  { params }: { params: { orderId: string } }
) {
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

    const body = await request.json()
    const { credentials, delivery_notes } = body
    const orderId = parseInt(params.orderId)

    const sql = getDb()

    // Get order details
    const order = await sql`
      SELECT
        o.id,
        o.buyer_id,
        o.product_id,
        o.quantity,
        o.is_delivered,
        b.email as buyer_email,
        b.full_name as buyer_name,
        p.name as product_name,
        p.sku as product_sku
      FROM orders o
      JOIN buyers b ON o.buyer_id = b.id
      JOIN products p ON o.product_id = p.id
      WHERE o.id = ${orderId}
    `

    if (!order || order.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const orderData = order[0]

    if (orderData.is_delivered) {
      return NextResponse.json(
        { error: 'This order has already been marked as delivered' },
        { status: 400 }
      )
    }

    // Get admin user details
    const adminUser = await sql`
      SELECT id FROM admin_users WHERE email = ${adminEmail}
    `

    const adminId = adminUser.length > 0 ? adminUser[0].id : null

    // Create product delivery record
    const delivery = await sql`
      INSERT INTO product_deliveries (
        order_id,
        buyer_id,
        product_id,
        quantity,
        product_name,
        credentials,
        delivery_notes,
        is_delivered,
        delivered_at,
        admin_id
      )
      VALUES (
        ${orderId},
        ${orderData.buyer_id},
        ${orderData.product_id},
        ${orderData.quantity},
        ${orderData.product_name},
        ${JSON.stringify(credentials || {})}::jsonb,
        ${delivery_notes || null},
        true,
        NOW(),
        ${adminId}
      )
      RETURNING *
    `

    // Mark order as delivered
    await sql`
      UPDATE orders
      SET
        is_delivered = true,
        delivered_at = NOW(),
        delivery_notes = ${delivery_notes || null}
      WHERE id = ${orderId}
    `

    return NextResponse.json(
      {
        success: true,
        message: `Product delivered to ${orderData.buyer_name}`,
        delivery: delivery[0],
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[AdminDeliveries] POST Error:', error)
    return NextResponse.json(
      { error: 'Failed to deliver product' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/deliveries/[orderId]
 * Get delivery details for an order
 */
export async function GET(
  request: Request,
  { params }: { params: { orderId: string } }
) {
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

    const orderId = parseInt(params.orderId)
    const sql = getDb()

    const delivery = await sql`
      SELECT
        pd.id,
        pd.order_id,
        pd.buyer_id,
        pd.product_id,
        pd.quantity,
        pd.product_name,
        pd.credentials,
        pd.delivery_notes,
        pd.is_delivered,
        pd.delivered_at,
        b.email as buyer_email,
        b.full_name as buyer_name,
        p.name as product_name
      FROM product_deliveries pd
      JOIN buyers b ON pd.buyer_id = b.id
      JOIN products p ON pd.product_id = p.id
      WHERE pd.order_id = ${orderId}
      ORDER BY pd.created_at DESC
    `

    return NextResponse.json(
      {
        success: true,
        deliveries: delivery || [],
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[AdminDeliveries] GET Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch delivery details' },
      { status: 500 }
    )
  }
}
