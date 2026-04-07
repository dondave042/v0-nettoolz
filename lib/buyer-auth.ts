import { cookies } from 'next/headers'
import { jwtVerify, SignJWT } from 'jose'
import { getDb } from './db'

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'buyer-secret-key-change-in-production'
)

export interface BuyerSession {
  id: number
  email: string
  name: string
  balance: number
  iat?: number
  exp?: number
}

export async function createBuyerToken(buyer: { id: number; email: string; name: string; balance: number }) {
  const token = await new SignJWT(buyer)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
  return token
}

export async function verifyBuyerToken(token: string): Promise<BuyerSession | null> {
  try {
    const verified = await jwtVerify(token, secret)
    return verified.payload as BuyerSession
  } catch (error) {
    return null
  }
}

export async function setBuyerCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set('buyer_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
}

export async function getBuyerSession(): Promise<BuyerSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('buyer_token')?.value

  if (!token) return null

  return verifyBuyerToken(token)
}

export async function clearBuyerCookie() {
  const cookieStore = await cookies()
  cookieStore.delete('buyer_token')
}

export async function buyerSignup(email: string, password: string, name: string) {
  const sql = getDb()

  try {
    // Check if buyer already exists
    const existing = await sql`
      SELECT id FROM buyers WHERE email = ${email}
    `

    if (existing.length > 0) {
      throw new Error('Email already registered')
    }

    // Hash password using a simple method (in production, use bcrypt)
    const passwordHash = Buffer.from(`${password}${email}`).toString('base64')

    // Create new buyer
    const result = await sql`
      INSERT INTO buyers (email, password_hash, full_name)
      VALUES (${email}, ${passwordHash}, ${name})
      RETURNING id, email, full_name as name
    `

    const buyer = result[0]
    const token = await createBuyerToken(buyer)
    await setBuyerCookie(token)

    return { success: true, buyer, token }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function buyerLogin(email: string, password: string) {
  const sql = getDb()

  try {
    const passwordHash = Buffer.from(`${password}${email}`).toString('base64')

    const result = await sql`
      SELECT id, email, full_name as name, password_hash FROM buyers WHERE email = ${email}
    `

    if (result.length === 0) {
      throw new Error('Invalid email or password')
    }

    const buyer = result[0]

    if (buyer.password_hash !== passwordHash) {
      throw new Error('Invalid email or password')
    }

    const token = await createBuyerToken({
      id: buyer.id,
      email: buyer.email,
      name: buyer.name,
    })
    await setBuyerCookie(token)

    return {
      success: true,
      buyer: { id: buyer.id, email: buyer.email, name: buyer.name },
      token,
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
