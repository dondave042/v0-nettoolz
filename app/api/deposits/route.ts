import { NextResponse } from 'next/server'
import { getBuyerSession } from '@/lib/buyer-auth'
import { getDb } from '@/lib/db'
import { getPaymentConfig } from '@/lib/payment-config'
import { createPendingDeposit, setDepositStatus } from '@/lib/schema-compat'

type CreateDepositRequest = {
    amount: number
    currency?: string
}

async function safeParseJson(response: Response): Promise<any> {
    const text = await response.text()

    if (!text) {
        return {}
    }

    try {
        return JSON.parse(text)
    } catch {
        return { message: text }
    }
}

function looksLikeInputValidationError(payload: any): boolean {
    const message = String(payload?.message || payload?.error || '').toLowerCase()
    return (
        message.includes('issue with your input') ||
        message.includes('invalid input') ||
        message.includes('validation') ||
        message.includes('invalid request')
    )
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

export async function POST(request: Request) {
    const buyer = await getBuyerSession()

    if (!buyer) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { amount, currency } = await request.json() as CreateDepositRequest
        const parsedAmount = Number(amount)
        const depositCurrency = (currency || 'NGN').toUpperCase()

        if (!Number.isFinite(parsedAmount) || parsedAmount < 100 || parsedAmount > 10000000) {
            return NextResponse.json(
                { error: 'Top-up amount must be between 100 and 10,000,000' },
                { status: 400 }
            )
        }

        const config = getPaymentConfig()
        const sql = getDb()
        const referenceId = `DEP-${buyer.id}-${Date.now()}`
        const normalizedEmail = String(buyer.email || '').trim().toLowerCase()
        const normalizedName = String(buyer.name || '').trim() || 'Customer'

        await createPendingDeposit(sql, {
            buyerId: buyer.id,
            amount: parsedAmount,
            referenceId,
        })

        const requestPayload = {
            amount: Math.round(parsedAmount * 100),
            currency: depositCurrency,
            reference: referenceId,
            customer: {
                email: normalizedEmail,
                name: normalizedName,
            },
            metadata: {
                payment_kind: 'deposit',
                buyer_id: String(buyer.id),
            },
            notification_url: `${config.webhookBaseUrl}/api/webhooks/korapay`,
            redirect_url: `${config.webhookBaseUrl}/dashboard?refresh=payment`,
        }

        let korapayResponse = await fetch(
            `${config.korapayApiBaseUrl}/charges/initialize`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${config.korapayApiKeySecret}`,
                },
                body: JSON.stringify(requestPayload),
            }
        )

        let responsePayload = await safeParseJson(korapayResponse)

        // Some Korapay setups expect major units for this endpoint.
        // Retry once with unscaled amount when validation fails.
        if (!korapayResponse.ok && looksLikeInputValidationError(responsePayload)) {
            korapayResponse = await fetch(
                `${config.korapayApiBaseUrl}/charges/initialize`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${config.korapayApiKeySecret}`,
                    },
                    body: JSON.stringify({
                        ...requestPayload,
                        amount: parsedAmount,
                    }),
                }
            )
            responsePayload = await safeParseJson(korapayResponse)
        }

        if (!korapayResponse.ok) {
            await setDepositStatus(sql, referenceId, 'failed', 'reference_id')

            return NextResponse.json(
                { error: responsePayload.message || responsePayload.error || 'Failed to initialize top-up payment' },
                { status: korapayResponse.status || 502 }
            )
        }

        return NextResponse.json({
            success: true,
            reference_id: referenceId,
            checkout_url: responsePayload.data?.checkout_url || responsePayload.checkout_url,
            amount: parsedAmount,
            currency: depositCurrency,
        })
    } catch (error) {
        console.error('[Deposits] Failed to initialize top-up:', error)
        return NextResponse.json(
            { error: 'Failed to initialize top-up' },
            { status: 500 }
        )
    }
}