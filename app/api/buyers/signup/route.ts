import { NextResponse } from 'next/server'
import { createBuyerToken, setBuyerCookie } from '@/lib/buyer-auth'
import { getDb } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const sql = getDb()

    // Check if buyer already exists
    const existing = await sql`
      SELECT id FROM buyers WHERE email = ${email}
    `

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = Buffer.from(`${password}${email}`).toString('base64')

    // Create new buyer
    const result = await sql`
      INSERT INTO buyers (email, password_hash, full_name, balance)
      VALUES (${email}, ${passwordHash}, ${name}, 0)
      RETURNING id, email, full_name as name, balance
    `

    const buyer = result[0]
    const token = await createBuyerToken({
      id: buyer.id,
      email: buyer.email,
      name: buyer.name,
      balance: buyer.balance,
    })

    // Create response with cookie
    const response = NextResponse.json(
      { success: true, buyer },
      { status: 201 }
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
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}
