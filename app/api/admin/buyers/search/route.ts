import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { getDb } from '@/lib/db'

export async function GET(request: NextRequest) {
  const admin = await getAdminSession()

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const url = new URL(request.url)
    const query = (url.searchParams.get('query') || '').trim().toLowerCase()

    if (query.length < 2) {
      return NextResponse.json({ buyers: [] })
    }

    const sql = getDb()
    const buyers = await sql`
      SELECT id, full_name, email, balance
      FROM buyers
      WHERE LOWER(email) LIKE ${`%${query}%`}
         OR LOWER(COALESCE(full_name, '')) LIKE ${`%${query}%`}
      ORDER BY updated_at DESC NULLS LAST, id DESC
      LIMIT 8
    `

    return NextResponse.json({
      buyers: buyers.map((row) => ({
        id: row.id,
        name: row.full_name,
        email: row.email,
        balance: Number(row.balance ?? 0),
      })),
    })
  } catch (error) {
    console.error('[Admin Buyer Search] Failed to search buyers:', error)
    return NextResponse.json(
      { error: 'Failed to search buyers' },
      { status: 500 }
    )
  }
}