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
    const response = await fetch(`${apiBaseUrl}/checkout/initialize`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
    })

    return {
        ok: response.ok,
        status: response.status,
        payload: await safeParseJson(response),
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

<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
        // Use checkout/initialize to get a hosted checkout URL
        const korapayEndpoint = `${config.korapayApiBaseUrl}/checkout/initialize`

        let korapayResponse = await fetch(korapayEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${config.korapayApiKeySecret}`,
            },
            body: JSON.stringify(requestPayload),
        })

        let responsePayload = await safeParseJson(korapayResponse)

        // Retry with amount in major units (naira) if we get an input validation error.
        if (!korapayResponse.ok && looksLikeInputValidationError(responsePayload)) {
            korapayResponse = await fetch(korapayEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${config.korapayApiKeySecret}`,
=======
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
>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======
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
>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======
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
>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======
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
>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======
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
>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======
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
>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======
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
>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======
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
>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======
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
>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======
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
>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
                },
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
                body: JSON.stringify({
                    ...requestPayload,
                    amount: parsedAmount,
                }),
            })
            responsePayload = await safeParseJson(korapayResponse)
=======
                notification_url: `${config.webhookBaseUrl}/api/webhooks/korapay`,
                redirect_url: `${config.webhookBaseUrl}/dashboard?refresh=payment`,
            },
        ]
=======
                notification_url: `${config.webhookBaseUrl}/api/webhooks/korapay`,
                redirect_url: `${config.webhookBaseUrl}/dashboard?refresh=payment`,
            },
        ]
>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======
                notification_url: `${config.webhookBaseUrl}/api/webhooks/korapay`,
                redirect_url: `${config.webhookBaseUrl}/dashboard?refresh=payment`,
            },
        ]
>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======
                notification_url: `${config.webhookBaseUrl}/api/webhooks/korapay`,
                redirect_url: `${config.webhookBaseUrl}/dashboard?refresh=payment`,
            },
        ]
>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======
                notification_url: `${config.webhookBaseUrl}/api/webhooks/korapay`,
                redirect_url: `${config.webhookBaseUrl}/dashboard?refresh=payment`,
            },
        ]
>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======
                notification_url: `${config.webhookBaseUrl}/api/webhooks/korapay`,
                redirect_url: `${config.webhookBaseUrl}/dashboard?refresh=payment`,
            },
        ]
>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======
                notification_url: `${config.webhookBaseUrl}/api/webhooks/korapay`,
                redirect_url: `${config.webhookBaseUrl}/dashboard?refresh=payment`,
            },
        ]
>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======
                notification_url: `${config.webhookBaseUrl}/api/webhooks/korapay`,
                redirect_url: `${config.webhookBaseUrl}/dashboard?refresh=payment`,
            },
        ]
>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======
                notification_url: `${config.webhookBaseUrl}/api/webhooks/korapay`,
                redirect_url: `${config.webhookBaseUrl}/dashboard?refresh=payment`,
            },
        ]
>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======
                notification_url: `${config.webhookBaseUrl}/api/webhooks/korapay`,
                redirect_url: `${config.webhookBaseUrl}/dashboard?refresh=payment`,
            },
        ]
>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447

        let selectedResult: KorapayInitResult | null = null
        const attemptErrors: Array<{ index: number; status: number; message: string }> = []

        for (let i = 0; i < attempts.length; i++) {
            const result = await initializeKorapayCharge(
                config.korapayApiBaseUrl,
                config.korapayApiKeySecret,
                attempts[i]
            )
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD

            if (result.ok) {
                selectedResult = result
                break
            }

            attemptErrors.push({
                index: i + 1,
                status: result.status,
                message: String(result.payload?.message || result.payload?.error || 'Initialization failed'),
            })

            const isInputIssue = looksLikeInputValidationError(result.payload)
            if (!isInputIssue && result.status >= 400 && result.status < 500) {
                // Stop retrying on clear client/auth errors that are not input-shape issues.
                selectedResult = result
                break
            }
>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======

            if (result.ok) {
                selectedResult = result
                break
            }

            attemptErrors.push({
                index: i + 1,
                status: result.status,
                message: String(result.payload?.message || result.payload?.error || 'Initialization failed'),
            })

            const isInputIssue = looksLikeInputValidationError(result.payload)
            if (!isInputIssue && result.status >= 400 && result.status < 500) {
                // Stop retrying on clear client/auth errors that are not input-shape issues.
                selectedResult = result
                break
            }
>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======

            if (result.ok) {
                selectedResult = result
                break
            }

            attemptErrors.push({
                index: i + 1,
                status: result.status,
                message: String(result.payload?.message || result.payload?.error || 'Initialization failed'),
            })

            const isInputIssue = looksLikeInputValidationError(result.payload)
            if (!isInputIssue && result.status >= 400 && result.status < 500) {
                // Stop retrying on clear client/auth errors that are not input-shape issues.
                selectedResult = result
                break
            }
>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======

            if (result.ok) {
                selectedResult = result
                break
            }

            attemptErrors.push({
                index: i + 1,
                status: result.status,
                message: String(result.payload?.message || result.payload?.error || 'Initialization failed'),
            })

            const isInputIssue = looksLikeInputValidationError(result.payload)
            if (!isInputIssue && result.status >= 400 && result.status < 500) {
                // Stop retrying on clear client/auth errors that are not input-shape issues.
                selectedResult = result
                break
            }
>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======

            if (result.ok) {
                selectedResult = result
                break
            }

            attemptErrors.push({
                index: i + 1,
                status: result.status,
                message: String(result.payload?.message || result.payload?.error || 'Initialization failed'),
            })

            const isInputIssue = looksLikeInputValidationError(result.payload)
            if (!isInputIssue && result.status >= 400 && result.status < 500) {
                // Stop retrying on clear client/auth errors that are not input-shape issues.
                selectedResult = result
                break
            }
>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======

            if (result.ok) {
                selectedResult = result
                break
            }

            attemptErrors.push({
                index: i + 1,
                status: result.status,
                message: String(result.payload?.message || result.payload?.error || 'Initialization failed'),
            })

            const isInputIssue = looksLikeInputValidationError(result.payload)
            if (!isInputIssue && result.status >= 400 && result.status < 500) {
                // Stop retrying on clear client/auth errors that are not input-shape issues.
                selectedResult = result
                break
            }
>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======

            if (result.ok) {
                selectedResult = result
                break
            }

            attemptErrors.push({
                index: i + 1,
                status: result.status,
                message: String(result.payload?.message || result.payload?.error || 'Initialization failed'),
            })

            const isInputIssue = looksLikeInputValidationError(result.payload)
            if (!isInputIssue && result.status >= 400 && result.status < 500) {
                // Stop retrying on clear client/auth errors that are not input-shape issues.
                selectedResult = result
                break
            }
>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======

            if (result.ok) {
                selectedResult = result
                break
            }

            attemptErrors.push({
                index: i + 1,
                status: result.status,
                message: String(result.payload?.message || result.payload?.error || 'Initialization failed'),
            })

            const isInputIssue = looksLikeInputValidationError(result.payload)
            if (!isInputIssue && result.status >= 400 && result.status < 500) {
                // Stop retrying on clear client/auth errors that are not input-shape issues.
                selectedResult = result
                break
            }
>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======

            if (result.ok) {
                selectedResult = result
                break
            }

            attemptErrors.push({
                index: i + 1,
                status: result.status,
                message: String(result.payload?.message || result.payload?.error || 'Initialization failed'),
            })

            const isInputIssue = looksLikeInputValidationError(result.payload)
            if (!isInputIssue && result.status >= 400 && result.status < 500) {
                // Stop retrying on clear client/auth errors that are not input-shape issues.
                selectedResult = result
                break
            }
>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======

            if (result.ok) {
                selectedResult = result
                break
            }

            attemptErrors.push({
                index: i + 1,
                status: result.status,
                message: String(result.payload?.message || result.payload?.error || 'Initialization failed'),
            })

            const isInputIssue = looksLikeInputValidationError(result.payload)
            if (!isInputIssue && result.status >= 400 && result.status < 500) {
                // Stop retrying on clear client/auth errors that are not input-shape issues.
                selectedResult = result
                break
            }
>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
        }

        if (!selectedResult || !selectedResult.ok) {
            await setDepositStatus(sql, referenceId, 'failed', 'reference_id')

<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
            const korapayError =
                responsePayload.message ||
                responsePayload.error ||
                (responsePayload.data && typeof responsePayload.data === 'object'
                    ? Object.values(responsePayload.data)
                        .map((v: any) => v?.message)
                        .filter(Boolean)
                        .join('; ')
                    : null) ||
                `Korapay error ${korapayResponse.status}`

            console.error('[Deposits] Korapay error:', korapayResponse.status, JSON.stringify(responsePayload))

=======
            const finalMessage = selectedResult?.payload?.message || selectedResult?.payload?.error || 'Failed to initialize top-up payment'

>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======
            const finalMessage = selectedResult?.payload?.message || selectedResult?.payload?.error || 'Failed to initialize top-up payment'

>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======
            const finalMessage = selectedResult?.payload?.message || selectedResult?.payload?.error || 'Failed to initialize top-up payment'

>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======
            const finalMessage = selectedResult?.payload?.message || selectedResult?.payload?.error || 'Failed to initialize top-up payment'

>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======
            const finalMessage = selectedResult?.payload?.message || selectedResult?.payload?.error || 'Failed to initialize top-up payment'

>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======
            const finalMessage = selectedResult?.payload?.message || selectedResult?.payload?.error || 'Failed to initialize top-up payment'

>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======
            const finalMessage = selectedResult?.payload?.message || selectedResult?.payload?.error || 'Failed to initialize top-up payment'

>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======
            const finalMessage = selectedResult?.payload?.message || selectedResult?.payload?.error || 'Failed to initialize top-up payment'

>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======
            const finalMessage = selectedResult?.payload?.message || selectedResult?.payload?.error || 'Failed to initialize top-up payment'

>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======
            const finalMessage = selectedResult?.payload?.message || selectedResult?.payload?.error || 'Failed to initialize top-up payment'

>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
            return NextResponse.json(
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
                { error: korapayError },
                { status: korapayResponse.status || 502 }
=======
                {
                    error: finalMessage,
                    details: process.env.NODE_ENV === 'development' ? attemptErrors : undefined,
                },
                { status: selectedResult?.status || 502 }
>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======
                {
                    error: finalMessage,
                    details: process.env.NODE_ENV === 'development' ? attemptErrors : undefined,
                },
                { status: selectedResult?.status || 502 }
>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======
                {
                    error: finalMessage,
                    details: process.env.NODE_ENV === 'development' ? attemptErrors : undefined,
                },
                { status: selectedResult?.status || 502 }
>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======
                {
                    error: finalMessage,
                    details: process.env.NODE_ENV === 'development' ? attemptErrors : undefined,
                },
                { status: selectedResult?.status || 502 }
>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======
                {
                    error: finalMessage,
                    details: process.env.NODE_ENV === 'development' ? attemptErrors : undefined,
                },
                { status: selectedResult?.status || 502 }
>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======
                {
                    error: finalMessage,
                    details: process.env.NODE_ENV === 'development' ? attemptErrors : undefined,
                },
                { status: selectedResult?.status || 502 }
>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======
                {
                    error: finalMessage,
                    details: process.env.NODE_ENV === 'development' ? attemptErrors : undefined,
                },
                { status: selectedResult?.status || 502 }
>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======
                {
                    error: finalMessage,
                    details: process.env.NODE_ENV === 'development' ? attemptErrors : undefined,
                },
                { status: selectedResult?.status || 502 }
>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======
                {
                    error: finalMessage,
                    details: process.env.NODE_ENV === 'development' ? attemptErrors : undefined,
                },
                { status: selectedResult?.status || 502 }
>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======
                {
                    error: finalMessage,
                    details: process.env.NODE_ENV === 'development' ? attemptErrors : undefined,
                },
                { status: selectedResult?.status || 502 }
>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
            )
        }

<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
        const checkoutUrl =
            responsePayload.data?.checkout_url ||
            responsePayload.data?.payment_url ||
            responsePayload.checkout_url

        if (!checkoutUrl) {
            console.error('[Deposits] No checkout_url in Korapay response:', JSON.stringify(responsePayload))
            await setDepositStatus(sql, referenceId, 'failed', 'reference_id')
            return NextResponse.json(
                { error: 'Payment provider did not return a checkout URL' },
                { status: 502 }
            )
        }

=======
        const responsePayload = selectedResult.payload

>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======
        const responsePayload = selectedResult.payload

>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======
        const responsePayload = selectedResult.payload

>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======
        const responsePayload = selectedResult.payload

>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======
        const responsePayload = selectedResult.payload

>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======
        const responsePayload = selectedResult.payload

>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======
        const responsePayload = selectedResult.payload

>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======
        const responsePayload = selectedResult.payload

>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======
        const responsePayload = selectedResult.payload

>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
=======
        const responsePayload = selectedResult.payload

>>>>>>> 73116a5bbc0c991087326ea756f0f914df7ab447
        return NextResponse.json({
            success: true,
            reference_id: referenceId,
            checkout_url: checkoutUrl,
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