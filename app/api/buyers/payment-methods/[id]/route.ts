import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getDb } from '@/lib/db'

/**
 * PUT /api/buyers/payment-methods/[id]
 * Updates a payment method
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const buyerId = cookieStore.get('buyer_id')?.value

    if (!buyerId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const methodId = parseInt(params.id)
    const body = await request.json()
    const { display_name, account_identifier, is_default, metadata } = body

    const sql = getDb()

    // Verify ownership
    const existing = await sql`
      SELECT id FROM user_payment_methods
      WHERE id = ${methodId} AND buyer_id = ${parseInt(buyerId)}
    `

    if (!existing || existing.length === 0) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      )
    }

    // If setting as default, unset others
    if (is_default) {
      await sql`
        UPDATE user_payment_methods
        SET is_default = false
        WHERE buyer_id = ${parseInt(buyerId)} AND id != ${methodId}
      `
    }

    // Update the method
    const result = await sql`
      UPDATE user_payment_methods
      SET
        display_name = ${display_name || null},
        account_identifier = ${account_identifier || null},
        is_default = ${is_default !== undefined ? is_default : null},
        metadata = ${metadata ? JSON.stringify(metadata) : null}::jsonb,
        updated_at = NOW()
      WHERE id = ${methodId}
      RETURNING
        id,
        payment_method_type,
        display_name,
        account_identifier,
        is_default,
        metadata,
        updated_at
    `

    return NextResponse.json(
      {
        success: true,
        message: 'Payment method updated successfully',
        method: result[0],
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[PaymentMethods] PUT Error:', error)
    return NextResponse.json(
      { error: 'Failed to update payment method' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/buyers/payment-methods/[id]
 * Deletes a payment method
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const buyerId = cookieStore.get('buyer_id')?.value

    if (!buyerId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const methodId = parseInt(params.id)
    const sql = getDb()

    // Verify ownership
    const existing = await sql`
      SELECT is_default FROM user_payment_methods
      WHERE id = ${methodId} AND buyer_id = ${parseInt(buyerId)}
    `

    if (!existing || existing.length === 0) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      )
    }

    const wasDefault = existing[0].is_default

    // Delete the method
    await sql`
      DELETE FROM user_payment_methods
      WHERE id = ${methodId}
    `

    // If it was default, set another as default
    if (wasDefault) {
      await sql`
        UPDATE user_payment_methods
        SET is_default = true
        WHERE buyer_id = ${parseInt(buyerId)}
        LIMIT 1
      `
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Payment method deleted successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[PaymentMethods] DELETE Error:', error)
    return NextResponse.json(
      { error: 'Failed to delete payment method' },
      { status: 500 }
    )
  }
}
