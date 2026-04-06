import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

/**
 * GET /api/payment-methods
 * Returns all active payment methods for checkout
 */
export async function GET() {
  try {
    const sql = getDb()

    // Fetch active payment methods
    const methods = await sql`
      SELECT 
        id,
        name,
        type,
        config,
        sort_order
      FROM payment_methods
      WHERE is_active = true
      ORDER BY sort_order ASC, name ASC
    `

    if (!methods || methods.length === 0) {
      return NextResponse.json(
        { 
          message: 'No active payment methods available',
          methods: [] 
        },
        { status: 200 }
      )
    }

    // Transform the response
    const paymentMethods = methods.map((method) => ({
      id: method.id,
      name: method.name,
      type: method.type,
      config: method.config || {},
    }))

    return NextResponse.json(
      {
        success: true,
        methods: paymentMethods,
        count: paymentMethods.length,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Payment Methods API] Error fetching payment methods:', error)

    return NextResponse.json(
      { 
        error: 'Failed to fetch payment methods',
        success: false 
      },
      { status: 500 }
    )
  }
}
