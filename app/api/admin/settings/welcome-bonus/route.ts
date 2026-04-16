import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@/lib/admin-auth"
import {
    getBuyerWelcomeBonus,
    getBuyerWelcomeBonusAudit,
    getWelcomeBonusFallback,
    updateBuyerWelcomeBonus,
} from "@/lib/welcome-bonus"

export async function GET() {
    const session = await getAdminSession()
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const [value, auditTrail] = await Promise.all([
            getBuyerWelcomeBonus(),
            getBuyerWelcomeBonusAudit(),
        ])

        return NextResponse.json({
            value,
            fallback: getWelcomeBonusFallback(),
            auditTrail,
        })
    } catch (error) {
        console.error("[Admin Welcome Bonus] Failed to load setting:", error)
        return NextResponse.json({ error: "Failed to load welcome bonus" }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    const session = await getAdminSession()
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { value } = await request.json()
        const normalizedValue = Number(value)

        if (!Number.isFinite(normalizedValue) || normalizedValue < 0) {
            return NextResponse.json({ error: "A valid non-negative amount is required" }, { status: 400 })
        }

        const nextValue = await updateBuyerWelcomeBonus(normalizedValue, {
            id: Number(session.id),
            email: String(session.email),
        })

        return NextResponse.json({ value: nextValue })
    } catch (error) {
        console.error("[Admin Welcome Bonus] Failed to update setting:", error)
        return NextResponse.json({ error: "Failed to update welcome bonus" }, { status: 500 })
    }
}