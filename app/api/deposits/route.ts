import { NextResponse } from 'next/server';

// Mock database of deposits
const deposits = [
    { id: 1, amount: 100, date: '2026-03-17' },
    { id: 2, amount: 200, date: '2026-03-18' },
];

export async function GET() {
    return NextResponse.json(deposits);
}