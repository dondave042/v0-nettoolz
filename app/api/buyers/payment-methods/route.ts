import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getDb } from '@/lib/db'

/**
 * GET /api/buyers/payment-methods
 * Returns all payment methods for the authenticated buyer
 */
export async function GET() {
  try {
    const cookieStore = await cookies()
    const buyerId = cookieStore.get('buyer_id')?.value

    if (!buyerId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const sql = getDb()

    const methods = await sql`
      SELECT
        id,
        payment_method_type,
        display_name,
        account_identifier,
        is_default,
        metadata,
        created_at,
        updated_at
      FROM user_payment_methods
      WHERE buyer_id = ${parseInt(buyerId)}
      ORDER BY is_default DESC, created_at DESC
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
    console.error('[PaymentMethods] GET Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/buyers/payment-methods
 * Adds a new payment method for the authenticated buyer
 */
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const buyerId = cookieStore.get('buyer_id')?.value

    if (!buyerId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      payment_method_type,
      display_name,
      account_identifier,
      is_default,
      metadata,
    } = body

    // Validation
    if (!payment_method_type || !display_name) {
      return NextResponse.json(
        { error: 'Missing required fields: payment_method_type, display_name' },
        { status: 400 }
      )
    }

    const sql = getDb()

    // If this is set as default, unset other defaults
    if (is_default) {
      await sql`
        UPDATE user_payment_methods
        SET is_default = false
        WHERE buyer_id = ${parseInt(buyerId)} AND is_default = true
      `
    }

    // Insert new payment method
    const result = await sql`
      INSERT INTO user_payment_methods (
        buyer_id,
        payment_method_type,
        display_name,
        account_identifier,
        is_default,
        metadata
      )
      VALUES (
        ${parseInt(buyerId)},
        ${payment_method_type},
        ${display_name},
        ${account_identifier || null},
        ${is_default || false},
        ${JSON.stringify(metadata || {})}::jsonb
      )
      RETURNING
        id,
        payment_method_type,
        display_name,
        account_identifier,
        is_default,
        metadata,
        created_at
    `

    const method = result[0]

    return NextResponse.json(
      {
        success: true,
        message: 'Payment method added successfully',
        method,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[PaymentMethods] POST Error:', error)
    return NextResponse.json(
      { error: 'Failed to add payment method' },
      { status: 500 }
    )
  }
}
