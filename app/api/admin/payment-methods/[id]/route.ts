import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { getDb } from '@/lib/db'

interface UpdatePaymentMethodRequest {
  name?: string
  type?: string
  config?: Record<string, unknown>
  is_active?: boolean
  sort_order?: number
}

/**
 * GET /api/admin/payment-methods/[id]
 * Get a specific payment method
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await getAdminSession()

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const sql = getDb()

    const methods = await sql`
      SELECT 
        id,
        name,
        type,
        config,
        is_active,
        sort_order,
        created_at,
        updated_at
      FROM payment_methods
      WHERE id = ${params.id}
    `

    if (methods.length === 0) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      )
    }

    const method = methods[0]

    return NextResponse.json(
      {
        success: true,
        method: {
          id: method.id,
          name: method.name,
          type: method.type,
          config: method.config || {},
          is_active: method.is_active,
          sort_order: method.sort_order,
          created_at: method.created_at,
          updated_at: method.updated_at,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Admin Payment Methods API] Error fetching method:', error)

    return NextResponse.json(
      { error: 'Failed to fetch payment method' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/payment-methods/[id]
 * Update a specific payment method
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await getAdminSession()

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = (await request.json()) as UpdatePaymentMethodRequest

    const sql = getDb()

    // Check if payment method exists
    const existing = await sql`
      SELECT id FROM payment_methods WHERE id = ${params.id}
    `

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      )
    }

    // Check if updating type and new type already exists elsewhere
    if (body.type) {
      const typeExists = await sql`
        SELECT id FROM payment_methods WHERE type = ${body.type} AND id != ${params.id}
      `

      if (typeExists.length > 0) {
        return NextResponse.json(
          { error: `Payment method type '${body.type}' already exists` },
          { status: 400 }
        )
      }
    }

    // Update payment method
    const result = await sql`
      UPDATE payment_methods
      SET 
        name = COALESCE(${body.name || null}, name),
        type = COALESCE(${body.type || null}, type),
        config = CASE 
          WHEN ${body.config ? JSON.stringify(body.config) : null}::text IS NOT NULL 
          THEN ${body.config ? JSON.stringify(body.config) : null}::jsonb 
          ELSE config 
        END,
        is_active = COALESCE(${body.is_active !== undefined ? body.is_active : null}, is_active),
        sort_order = COALESCE(${body.sort_order !== undefined ? body.sort_order : null}, sort_order),
        updated_at = NOW()
      WHERE id = ${params.id}
      RETURNING id, name, type, config, is_active, sort_order, created_at, updated_at
    `

    const method = result[0]

    console.log(
      `[Admin Payment Methods API] Updated payment method: ${method.type} (ID: ${method.id})`
    )

    return NextResponse.json(
      {
        success: true,
        message: 'Payment method updated successfully',
        method: {
          id: method.id,
          name: method.name,
          type: method.type,
          config: method.config || {},
          is_active: method.is_active,
          sort_order: method.sort_order,
          created_at: method.created_at,
          updated_at: method.updated_at,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Admin Payment Methods API] Error updating method:', error)

    return NextResponse.json(
      { error: 'Failed to update payment method' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/payment-methods/[id]
 * Delete a specific payment method
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await getAdminSession()

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const sql = getDb()

    // Check if payment method exists
    const existing = await sql`
      SELECT id FROM payment_methods WHERE id = ${params.id}
    `

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      )
    }

    // Check if any orders reference this payment method
    const ordersUsing = await sql`
      SELECT COUNT(*) as count FROM orders WHERE payment_method_id = ${params.id}
    `

    if (ordersUsing[0].count > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete payment method. It is referenced by ${ordersUsing[0].count} order(s).`,
        },
        { status: 400 }
      )
    }

    // Delete payment method
    await sql`
      DELETE FROM payment_methods WHERE id = ${params.id}
    `

    console.log(`[Admin Payment Methods API] Deleted payment method (ID: ${params.id})`)

    return NextResponse.json(
      {
        success: true,
        message: 'Payment method deleted successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Admin Payment Methods API] Error deleting method:', error)

    return NextResponse.json(
      { error: 'Failed to delete payment method' },
      { status: 500 }
    )
  }
}
