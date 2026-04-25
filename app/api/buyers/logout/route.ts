import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ success: true }, { status: 200 })

  // Clear the buyer token cookie
  response.cookies.set('buyer_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })

  return response
}
