import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function GET() {
    const start = Date.now()

    let dbStatus: "ok" | "error" = "ok"
    let dbError: string | null = null
    let dbLatencyMs: number | null = null

    try {
        const sql = getDb()
        await sql`SELECT 1`
        dbLatencyMs = Date.now() - start
    } catch (err: unknown) {
        dbStatus = "error"
        dbLatencyMs = Date.now() - start
        dbError =
            err instanceof Error
                ? err.message
                : "Unknown database error"
    }

    const status = dbStatus === "ok" ? 200 : 503

    return NextResponse.json(
        {
            status: dbStatus === "ok" ? "ok" : "degraded",
            db: {
                status: dbStatus,
                latencyMs: dbLatencyMs,
                ...(dbError ? { error: dbError } : {}),
            },
            timestamp: new Date().toISOString(),
        },
        { status }
    )
}
