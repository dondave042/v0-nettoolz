import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const { amount, currency, email } = await request.json();

    const apiKeyId = process.env.KORAPAY_API_KEY_ID || 'KPY46648'; // Fallback to hardcoded for testing
    const checkoutUrl = process.env.KORAPAY_CHECKOUT_URL || 'https://checkout.korapay.com/pay/nettoolz';

    const response = await fetch(checkoutUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKeyId}`,
        },
        body: JSON.stringify({ amount, currency, email }),
    });

    const data = await response.json();

    if (!response.ok) {
        return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
}