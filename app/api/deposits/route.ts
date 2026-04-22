import { NextResponse } from 'next/server'
import { getBuyerSession } from '@/lib/buyer-auth'
import { getDb } from '@/lib/db'
import { getPaymentConfig } from '@/lib/payment-config'
import { createPendingDeposit, setDepositStatus } from '@/lib/schema-compat'

type CreateDepositRequest = {
    amount: number
    currency?: string
}

type KorapayInitResult = {
    ok: boolean
    status: number
    payload: any
    endpoint?: string
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

async function initializeKorapayCharge(
    apiBaseUrl: string,
    apiKey: string,
    payload: Record<string, any>
): Promise<KorapayInitResult> {
    const normalizedBase = apiBaseUrl.replace(/\/$/, '')
    const strippedBase = normalizedBase.replace(/\/api\/v1$/, '')
    const baseCandidates = Array.from(new Set([normalizedBase, strippedBase]))
    const endpointCandidates = [
        '/checkout/initialize',
        '/charges/initialize',
        '/api/v1/checkout/initialize',
        '/api/v1/charges/initialize',
    ]
    let lastResult: KorapayInitResult | null = null

    for (const base of baseCandidates) {
        for (const endpoint of endpointCandidates) {
            const response = await fetch(`${base}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify(payload),
            })

            const result: KorapayInitResult = {
                ok: response.ok,
                status: response.status,
                payload: await safeParseJson(response),
                endpoint: `${base}${endpoint}`,
            }

            if (result.ok) {
                return result
            }

            const message = String(result.payload?.message || result.payload?.error || '').toLowerCase()
            const isNotFound = result.status === 404 || message.includes('resource not found') || message.includes('not found')

            lastResult = result
            if (!isNotFound) {
                return result
            }
        }
    }

    return lastResult || {
        ok: false,
        status: 502,
        payload: { message: 'Failed to initialize Korapay charge' },
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
            amount: Math.round(parsedAmount),
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

        const attempts: Array<Record<string, any>> = [
            requestPayload,
            { ...requestPayload, amount: parsedAmount },
            {
                ...requestPayload,
                metadata: undefined,
            },
            {
                ...requestPayload,
                amount: parsedAmount,
                metadata: undefined,
            },
            {
                amount: parsedAmount,
                currency: depositCurrency,
                reference: referenceId,
                customer: {
                    email: normalizedEmail,
                },
                notification_url: `${config.webhookBaseUrl}/api/webhooks/korapay`,
                redirect_url: `${config.webhookBaseUrl}/dashboard?refresh=payment`,
            },
        ]

        let selectedResult: KorapayInitResult | null = null
        const attemptErrors: Array<{ index: number; status: number; message: string; endpoint?: string }> = []

        for (let i = 0; i < attempts.length; i++) {
            const result = await initializeKorapayCharge(
                config.korapayApiBaseUrl,
                config.korapayApiKeySecret,
                attempts[i]
            )

            if (result.ok) {
                selectedResult = result
                break
            }

            attemptErrors.push({
                index: i + 1,
                status: result.status,
                message: String(result.payload?.message || result.payload?.error || 'Initialization failed'),
                endpoint: result.endpoint,
            })

            const isInputIssue = looksLikeInputValidationError(result.payload)
            if (!isInputIssue && result.status >= 400 && result.status < 500) {
                // Stop retrying on clear client/auth errors that are not input-shape issues.
                selectedResult = result
                break
            }
        }

        if (!selectedResult || !selectedResult.ok) {
            await setDepositStatus(sql, referenceId, 'failed', 'reference_id')

            const finalMessage = selectedResult?.payload?.message || selectedResult?.payload?.error || 'Failed to initialize top-up payment'

            return NextResponse.json(
                {
                    error: finalMessage,
                    details: process.env.NODE_ENV === 'development' ? attemptErrors : undefined,
                },
                { status: selectedResult?.status || 502 }
            )
        }

        const responsePayload = selectedResult.payload

        return NextResponse.json({
            success: true,
            reference_id: referenceId,
            checkout_url: responsePayload.data?.checkout_url || responsePayload.data?.payment_url || responsePayload.checkout_url,
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
