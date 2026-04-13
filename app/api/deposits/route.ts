import { NextResponse } from 'next/server'
import { getBuyerSession } from '@/lib/buyer-auth'
import { getDb } from '@/lib/db'

export async function GET() {
    const buyer = await getBuyerSession()

    if (!buyer) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const sql = getDb()
        const rows = await sql`
            SELECT
                id,
                amount,
                status,
                reference_id,
                created_at,
                CASE
                    WHEN reference_id LIKE 'WELCOME-BONUS-%' THEN 'welcome_bonus'
                    ELSE 'deposit'
                END AS type,
                CASE
                    WHEN reference_id LIKE 'WELCOME-BONUS-%' THEN 'Welcome bonus'
                    ELSE 'Balance top-up'
                END AS description
            FROM deposits
            WHERE buyer_id = ${buyer.id}
            ORDER BY created_at DESC
            LIMIT 10
        `

        return NextResponse.json({
            deposits: rows.map((row) => ({
                id: row.id,
                amount: parseFloat(row.amount ?? 0),
                status: row.status,
                reference_id: row.reference_id,
                created_at: row.created_at,
                type: row.type,
                description: row.description,
            })),
        })
    } catch (error) {
        console.error('[Deposits] Failed to fetch deposits:', error)
        return NextResponse.json(
            { error: 'Failed to fetch deposits' },
            { status: 500 }
        )
    }
}