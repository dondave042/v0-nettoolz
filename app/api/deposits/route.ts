import { NextResponse } from 'next/server'
import { getBuyerSession } from '@/lib/buyer-auth'
import { getDb } from '@/lib/db'
import { getPaymentConfig } from '@/lib/payment-config'

/**
 * POST /api/deposits
 * Creates a pending deposit and initializes a Korapay payment for balance funding.
 * On successful payment (via webhook), the deposit is completed and buyer balance is credited.
 */
export async function POST(request: Request) {
    const buyer = await getBuyerSession()

    if (!buyer) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { amount } = await request.json()

        if (!amount || typeof amount !== 'number' || amount <= 0) {
            return NextResponse.json(
                { error: 'Amount must be a positive number' },
                { status: 400 }
            )
        }

        if (amount > 1_000_000) {
            return NextResponse.json(
                { error: 'Amount exceeds maximum deposit limit' },
                { status: 400 }
            )
        }

        const config = getPaymentConfig()
        const sql = getDb()

        const referenceId = `DEP-${buyer.id}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`

        // Create pending deposit record
        const deposits = await sql`
            INSERT INTO deposits (buyer_id, amount, reference_id, status, created_at, updated_at)
            VALUES (${buyer.id}, ${amount}, ${referenceId}, 'pending', NOW(), NOW())
            RETURNING id, amount, reference_id, status, created_at
        `

        if (!deposits || deposits.length === 0) {
            return NextResponse.json(
                { error: 'Failed to create deposit record' },
                { status: 500 }
            )
        }

        // Initialize Korapay payment for deposit
        const korapayResponse = await fetch(
            `${config.korapayCheckoutUrl}/charges/initialize`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${config.korapayApiKeySecret}`,
                },
                body: JSON.stringify({
                    amount: Math.round(amount * 100),
                    currency: 'NGN',
                    reference: referenceId,
                    customer: {
                        email: buyer.email,
                        name: buyer.name || 'Customer',
                    },
                    metadata: {
                        deposit_id: deposits[0].id,
                        buyer_id: buyer.id,
                        type: 'balance_deposit',
                    },
                    notification_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/korapay`,
                }),
            }
        )

        if (!korapayResponse.ok) {
            // Mark deposit as failed if payment init fails
            await sql`
                UPDATE deposits SET status = 'failed', updated_at = NOW()
                WHERE id = ${deposits[0].id}
            `
            const errorData = await korapayResponse.json().catch(() => ({}))
            console.error('[Deposits] Korapay init error:', errorData)
            return NextResponse.json(
                { error: 'Failed to initialize payment' },
                { status: 502 }
            )
        }

        const korapayData = await korapayResponse.json()

        return NextResponse.json({
            success: true,
            deposit: {
                id: deposits[0].id,
                amount: parseFloat(deposits[0].amount),
                reference_id: deposits[0].reference_id,
                status: deposits[0].status,
            },
            checkout_url: korapayData.data?.checkout_url || korapayData.checkout_url,
            reference: referenceId,
        })
    } catch (error) {
        console.error('[Deposits] Failed to create deposit:', error)
        return NextResponse.json(
            { error: 'Failed to process deposit' },
            { status: 500 }
        )
    }
}

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