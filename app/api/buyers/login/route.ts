import { NextResponse } from 'next/server'
import { createBuyerToken } from '@/lib/buyer-auth'
import { getDb } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const sql = getDb()
    const passwordHash = Buffer.from(`${password}${email}`).toString('base64')

    const result = await sql`
      SELECT id, email, full_name as name, password_hash FROM buyers WHERE email = ${email}
    `

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const buyer = result[0]

    if (buyer.password_hash !== passwordHash) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const token = await createBuyerToken({
      id: buyer.id,
      email: buyer.email,
      name: buyer.name,
    })

    // Create response with cookie
    const response = NextResponse.json(
      { success: true, buyer: { id: buyer.id, email: buyer.email, name: buyer.name } },
      { status: 200 }
    )

    // Set cookie in response
    response.cookies.set('buyer_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    )
  }
}
