import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { getDb } from '@/lib/db'

interface CreatePaymentMethodRequest {
  name: string
  type: string
  config?: Record<string, unknown>
  is_active?: boolean
  sort_order?: number
}

interface UpdatePaymentMethodRequest {
  name?: string
  type?: string
  config?: Record<string, unknown>
  is_active?: boolean
  sort_order?: number
}

/**
 * GET /api/admin/payment-methods
 * Returns all payment methods (active and inactive) for admin management
 */
export async function GET(request: Request) {
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
      ORDER BY sort_order ASC, name ASC
    `

    return NextResponse.json(
      {
        success: true,
        methods: methods || [],
        count: methods?.length || 0,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Admin Payment Methods API] Error fetching methods:', error)

    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/payment-methods
 * Creates a new payment method
 */
export async function POST(request: Request) {
  const admin = await getAdminSession()

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = (await request.json()) as CreatePaymentMethodRequest

    // Validate required fields
    if (!body.name || !body.type) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type' },
        { status: 400 }
      )
    }

    const sql = getDb()

    // Check if payment method with same type already exists
    const existing = await sql`
      SELECT id FROM payment_methods WHERE type = ${body.type}
    `

    if (existing.length > 0) {
      return NextResponse.json(
        { error: `Payment method with type '${body.type}' already exists` },
        { status: 400 }
      )
    }

    // Create payment method
    const result = await sql`
      INSERT INTO payment_methods (
        name,
        type,
        config,
        is_active,
        sort_order,
        created_at,
        updated_at
      )
      VALUES (
        ${body.name},
        ${body.type},
        ${body.config ? JSON.stringify(body.config) : null}::jsonb,
        ${body.is_active ?? true},
        ${body.sort_order ?? 0},
        NOW(),
        NOW()
      )
      RETURNING id, name, type, config, is_active, sort_order, created_at, updated_at
    `

    const method = result[0]

    console.log(
      `[Admin Payment Methods API] Created payment method: ${body.type} (ID: ${method.id})`
    )

    return NextResponse.json(
      {
        success: true,
        message: 'Payment method created successfully',
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
      { status: 201 }
    )
  } catch (error) {
    console.error('[Admin Payment Methods API] Error creating method:', error)

    return NextResponse.json(
      { error: 'Failed to create payment method' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/payment-methods/[id]
 * Updates a payment method
 */
export async function PUT(request: Request) {
  const admin = await getAdminSession()

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Missing payment method ID' },
        { status: 400 }
      )
    }

    const body = (await request.json()) as UpdatePaymentMethodRequest

    const sql = getDb()

    // Check if payment method exists
    const existing = await sql`
      SELECT id FROM payment_methods WHERE id = ${id}
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
        SELECT id FROM payment_methods WHERE type = ${body.type} AND id != ${id}
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
          WHEN ${body.config ? JSON.stringify(body.config) : null} IS NOT NULL 
          THEN ${body.config ? JSON.stringify(body.config) : null}::jsonb 
          ELSE config 
        END,
        is_active = COALESCE(${body.is_active !== undefined ? body.is_active : null}, is_active),
        sort_order = COALESCE(${body.sort_order !== undefined ? body.sort_order : null}, sort_order),
        updated_at = NOW()
      WHERE id = ${id}
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
 * Deletes a payment method (only if not referenced by any orders)
 */
export async function DELETE(request: Request) {
  const admin = await getAdminSession()

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Missing payment method ID' },
        { status: 400 }
      )
    }

    const sql = getDb()

    // Check if payment method exists
    const existing = await sql`
      SELECT id FROM payment_methods WHERE id = ${id}
    `

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      )
    }

    // Check if any orders reference this payment method
    const ordersUsing = await sql`
      SELECT COUNT(*) as count FROM orders WHERE payment_method_id = ${id}
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
      DELETE FROM payment_methods WHERE id = ${id}
    `

    console.log(`[Admin Payment Methods API] Deleted payment method (ID: ${id})`)

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
