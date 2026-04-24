import { NextRequest, NextResponse } from 'next/server'
import { getBuyerSession } from '@/lib/buyer-auth'
import { ensureOrderCredentialsTable, extractCredentialFields } from '@/lib/credentials-inventory'

type OrderRow = {
  id: number
  buyer_id: number
  product_id: number | null
  product_name: string | null
  quantity: number
  total_price: string | number
  payment_status: string | null
  order_status: string | null
  payment_method_name: string | null
  payment_reference_id: string | null
  payment_error_message: string | null
  created_at: string
  updated_at: string | null
  payment_completed_at: string | null
  credential_id: number | null
  username: string | null
  password: string | null
  credential_data: string | null
  product_username: string | null
  product_password: string | null
}

/**
 * GET /api/orders
 * Fetches all orders for the authenticated buyer with product and payment details
 * Returns orders with payment status, methods, and credential count
 */
export async function GET(request: NextRequest) {
  const buyer = await getBuyerSession()

  if (!buyer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const sql = await ensureOrderCredentialsTable()

    const rows = await sql`
      SELECT
        o.id,
        o.buyer_id,
        o.product_id,
        p.name as product_name,
        p.product_username,
        p.product_password,
        o.quantity,
        o.total_price,
        o.payment_status,
        o.status as order_status,
        pm.name as payment_method_name,
        o.payment_reference_id,
        o.payment_error_message,
        o.created_at,
        o.updated_at,
        o.payment_completed_at,
        bci.id as credential_id,
        bci.username,
        bci.password,
        bci.credential_data
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      LEFT JOIN payment_methods pm ON o.payment_method_id = pm.id
      LEFT JOIN order_credentials oc ON o.id = oc.order_id
      LEFT JOIN buyer_credentials_inventory bci ON bci.id = oc.credential_id
      WHERE o.buyer_id = ${buyer.id}
      ORDER BY o.created_at DESC, oc.created_at ASC, bci.id ASC
    `

    const ordersById = new Map<number, any>()

    for (const row of rows as OrderRow[]) {
      const existingOrder = ordersById.get(row.id)

      if (!existingOrder) {
        const fallbackCredentials =
          row.payment_status === 'completed' && (row.product_username || row.product_password)
            ? [{
              id: null,
              username: row.product_username,
              password: row.product_password,
            }]
            : []

        ordersById.set(row.id, {
          id: row.id,
          product_id: row.product_id,
          product_name: row.product_name,
          quantity: Number(row.quantity ?? 0),
          total_price: row.total_price,
          payment_status: row.payment_status,
          order_status: row.order_status,
          payment_method_name: row.payment_method_name,
          payment_reference_id: row.payment_reference_id,
          payment_error_message: row.payment_error_message,
          created_at: row.created_at,
          updated_at: row.updated_at,
          payment_completed_at: row.payment_completed_at,
          credentials: fallbackCredentials,
        })
      }

      if (row.credential_id) {
        const credential = extractCredentialFields(row)
        if (credential.username || credential.password) {
          const order = ordersById.get(row.id)
          if (order.credentials.some((entry: { id: number | null }) => entry.id === row.credential_id)) {
            continue
          }

          if (
            order.credentials.length === 1 &&
            order.credentials[0].id === null &&
            (order.credentials[0].username || order.credentials[0].password)
          ) {
            order.credentials = []
          }

          order.credentials.push({
            id: row.credential_id,
            username: credential.username,
            password: credential.password,
          })
        }
      }
    }

    const orders = Array.from(ordersById.values()).map((order) => ({
      ...order,
      credential_count: order.credentials.length,
    }))

    return NextResponse.json({
      orders,
      total: orders.length,
    })
  } catch (error) {
    console.error('[Orders] Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}
