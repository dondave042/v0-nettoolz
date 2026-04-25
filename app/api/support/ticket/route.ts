import { NextRequest, NextResponse } from "next/server"
import { getBuyerSession } from "@/lib/buyer-auth"
import { getDb } from "@/lib/db"

/**
 * POST /api/support/ticket
 * Creates a support ticket. Auth is optional — guests can also submit.
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getBuyerSession()
        const body = await request.json()
        const { subject, message } = body

        if (!subject?.trim() || !message?.trim()) {
            return NextResponse.json(
                { error: "Subject and message are required" },
                { status: 400 }
            )
        }

        if (subject.length > 200) {
            return NextResponse.json(
                { error: "Subject must be 200 characters or less" },
                { status: 400 }
            )
        }

        if (message.length > 5000) {
            return NextResponse.json(
                { error: "Message must be 5000 characters or less" },
                { status: 400 }
            )
        }

        const sql = getDb()

        // Ensure support_tickets table exists (graceful fallback)
        await sql`
      CREATE TABLE IF NOT EXISTS public.support_tickets (
        id         BIGSERIAL PRIMARY KEY,
        buyer_id   INTEGER REFERENCES public.buyers(id) ON DELETE SET NULL,
        subject    TEXT NOT NULL,
        message    TEXT NOT NULL,
        status     TEXT NOT NULL DEFAULT 'open',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `

        const result = await sql`
      INSERT INTO public.support_tickets (buyer_id, subject, message, status)
      VALUES (
        ${session?.id ?? null},
        ${subject.trim()},
        ${message.trim()},
        'open'
      )
      RETURNING id, subject, status, created_at
    `

        return NextResponse.json({ success: true, ticket: result[0] }, { status: 201 })
    } catch (error: unknown) {
        console.error("[Support Ticket] Error:", error)
        return NextResponse.json(
            { error: "Failed to submit support ticket" },
            { status: 500 }
        )
    }
}

/**
 * GET /api/support/ticket
 * Returns the authenticated user's support tickets
 */
export async function GET() {
    const session = await getBuyerSession()
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const sql = getDb()
        const tickets = await sql`
      SELECT id, subject, status, created_at, updated_at
      FROM public.support_tickets
      WHERE buyer_id = ${session.id}
      ORDER BY created_at DESC
      LIMIT 20
    `
        return NextResponse.json({ tickets })
    } catch (error) {
        console.error("[Support Ticket] GET error:", error)
        return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 })
    }
}
