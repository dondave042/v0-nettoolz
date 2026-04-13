import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { createBalanceAdjustment } from '@/lib/balance-adjustments'
import { getDb } from '@/lib/db'

export async function POST(request: Request) {
  const admin = await getAdminSession()

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { email, amount, reason } = await request.json()
    const parsedAmount = Number(amount)

    if (!email || !Number.isFinite(parsedAmount) || parsedAmount === 0) {
      return NextResponse.json(
        { error: 'Buyer email and a non-zero amount are required' },
        { status: 400 }
      )
    }

    const sql = getDb()
    const buyers = await sql`
      SELECT id, email, full_name, balance
      FROM buyers
      WHERE email = ${String(email).toLowerCase().trim()}
      LIMIT 1
    `

    if (buyers.length === 0) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })
    }

    const buyer = buyers[0]
    const currentBalance = parseFloat(buyer.balance ?? 0)
    const nextBalance = currentBalance + parsedAmount

    if (nextBalance < 0) {
      return NextResponse.json(
        { error: 'Adjustment would reduce buyer balance below zero' },
        { status: 400 }
      )
    }

    await sql`
      UPDATE buyers
      SET balance = ${nextBalance}, updated_at = NOW()
      WHERE id = ${buyer.id}
    `

    const adjustment = await createBalanceAdjustment({
      buyerId: buyer.id,
      adminUserId: admin.id,
      adminEmail: admin.email,
      amount: parsedAmount,
      reason: reason || null,
    })

    return NextResponse.json({
      success: true,
      buyer: {
        id: buyer.id,
        email: buyer.email,
        name: buyer.full_name,
        balance: nextBalance,
      },
      adjustment,
    })
  } catch (error) {
    console.error('[Admin Balance Adjustments] Failed to create adjustment:', error)
    return NextResponse.json(
      { error: 'Failed to create balance adjustment' },
      { status: 500 }
    )
  }
}