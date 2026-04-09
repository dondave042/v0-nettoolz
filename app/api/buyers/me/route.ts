import { NextResponse } from 'next/server'
import { getBuyerSession, clearBuyerCookie } from '@/lib/buyer-auth'
import { getDb } from '@/lib/db'

export async function GET() {
  try {
    const session = await getBuyerSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const sql = getDb()
    const result = await sql`
      SELECT balance FROM buyers WHERE id = ${session.id}
    `

    const balance = result.length > 0 ? parseFloat(result[0].balance ?? '0') : 0

    return NextResponse.json({ buyer: { ...session, balance } })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json(
      { error: 'Failed to verify session' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const { action } = await request.json()

  if (action === 'logout') {
    await clearBuyerCookie()
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
