import { NextResponse } from 'next/server'
import { getBuyerSession, clearBuyerCookie } from '@/lib/buyer-auth'

export async function GET() {
  try {
    const session = await getBuyerSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    return NextResponse.json({ buyer: session })
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
