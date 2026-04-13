import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import {
  getBuyerWelcomeBonusAudit,
  getBuyerWelcomeBonus,
  getWelcomeBonusFallback,
  updateBuyerWelcomeBonus,
} from '@/lib/welcome-bonus'

export async function GET() {
  const admin = await getAdminSession()

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const value = await getBuyerWelcomeBonus()
    const auditTrail = await getBuyerWelcomeBonusAudit()

    return NextResponse.json({
      value,
      fallback: getWelcomeBonusFallback(),
      auditTrail,
    })
  } catch (error) {
    console.error('[Admin Welcome Bonus] Failed to fetch setting:', error)
    return NextResponse.json(
      { error: 'Failed to fetch welcome bonus setting' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  const admin = await getAdminSession()

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { value } = await request.json()
    const parsedValue = Number(value)

    if (!Number.isFinite(parsedValue) || parsedValue < 0) {
      return NextResponse.json(
        { error: 'Welcome bonus must be a valid non-negative number' },
        { status: 400 }
      )
    }

    const updatedValue = await updateBuyerWelcomeBonus(parsedValue, admin)
    return NextResponse.json({ success: true, value: updatedValue })
  } catch (error) {
    console.error('[Admin Welcome Bonus] Failed to update setting:', error)
    return NextResponse.json(
      { error: 'Failed to update welcome bonus setting' },
      { status: 500 }
    )
  }
}