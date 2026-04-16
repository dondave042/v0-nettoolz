import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getAdminSession } from "@/lib/admin-auth"
import { createBalanceAdjustment } from "@/lib/balance-adjustments"

export async function POST(request: NextRequest) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { email, amount, reason } = await request.json()
    const normalizedEmail = String(email || "").trim().toLowerCase()
    const normalizedAmount = Number(amount)

    if (!normalizedEmail || !Number.isFinite(normalizedAmount) || normalizedAmount === 0) {
      return NextResponse.json(
        { error: "A buyer email and non-zero amount are required" },
        { status: 400 },
      )
    }

    const sql = getDb()
    const buyers = await sql`
      SELECT id, email, balance
      FROM buyers
      WHERE LOWER(email) = LOWER(${normalizedEmail})
      LIMIT 1
    `

    if (buyers.length === 0) {
      return NextResponse.json({ error: "Buyer not found" }, { status: 404 })
    }

    const buyerId = buyers[0].id
    const updatedBuyers = await sql`
      UPDATE buyers
      SET
        balance = COALESCE(balance, 0) + ${normalizedAmount},
        updated_at = NOW()
      WHERE id = ${buyerId}
      RETURNING id, email, balance
    `

    const adjustment = await createBalanceAdjustment({
      buyerId,
      adminUserId: Number(session.id),
      adminEmail: String(session.email),
      amount: normalizedAmount,
      reason: reason ? String(reason) : null,
    })

    return NextResponse.json({ buyer: updatedBuyers[0], adjustment }, { status: 201 })
  } catch (error) {
    console.error("[Admin Balance Adjustments] Failed to update balance:", error)
    return NextResponse.json({ error: "Failed to update buyer balance" }, { status: 500 })
  }
}