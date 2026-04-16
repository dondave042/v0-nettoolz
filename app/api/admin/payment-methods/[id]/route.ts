import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getAdminSession } from "@/lib/admin-auth"

async function ensurePaymentMethodsSchema() {
    const sql = getDb()

    await sql`
    CREATE TABLE IF NOT EXISTS payment_methods (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      type VARCHAR(50),
      config JSONB DEFAULT '{}'::jsonb,
      is_active BOOLEAN DEFAULT TRUE,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `

    await sql`ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}'::jsonb`
    await sql`ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0`
    await sql`ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
    await sql`ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
    await sql`ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE`

    return sql
}

async function requireAdmin() {
    const session = await getAdminSession()
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return null
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const unauthorizedResponse = await requireAdmin()
    if (unauthorizedResponse) {
        return unauthorizedResponse
    }

    try {
        const { id } = await params
        const methodId = Number(id)
        if (!Number.isInteger(methodId)) {
            return NextResponse.json({ error: "Invalid payment method id" }, { status: 400 })
        }

        const sql = await ensurePaymentMethodsSchema()
        const payload = await request.json()
        const existingRows = await sql`SELECT id, name, type, config, is_active, sort_order FROM payment_methods WHERE id = ${methodId} LIMIT 1`
        const existingMethod = existingRows[0]

        if (!existingMethod) {
            return NextResponse.json({ error: "Payment method not found" }, { status: 404 })
        }

        const nextName = payload.name !== undefined ? String(payload.name).trim() : existingMethod.name
        const nextType = payload.type !== undefined ? String(payload.type).trim().toLowerCase() : existingMethod.type
        const nextConfig = payload.config !== undefined ? payload.config : existingMethod.config
        const nextActive = payload.is_active !== undefined ? Boolean(payload.is_active) : existingMethod.is_active
        const nextSortOrder = payload.sort_order !== undefined ? Number(payload.sort_order) : existingMethod.sort_order

        const rows = await sql`
      UPDATE payment_methods
      SET
        name = ${nextName},
        type = ${nextType},
        config = ${JSON.stringify(nextConfig || {})}::jsonb,
        is_active = ${nextActive},
        sort_order = ${Number.isFinite(nextSortOrder) ? nextSortOrder : 0},
        updated_at = NOW()
      WHERE id = ${methodId}
      RETURNING
        id,
        name,
        type,
        COALESCE(config, '{}'::jsonb) AS config,
        COALESCE(is_active, TRUE) AS is_active,
        COALESCE(sort_order, 0) AS sort_order,
        created_at,
        updated_at
    `

        return NextResponse.json({ method: rows[0] })
    } catch (error) {
        console.error("[Admin Payment Methods] Failed to update method:", error)
        return NextResponse.json({ error: "Failed to update payment method" }, { status: 500 })
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const unauthorizedResponse = await requireAdmin()
    if (unauthorizedResponse) {
        return unauthorizedResponse
    }

    try {
        const { id } = await params
        const methodId = Number(id)
        if (!Number.isInteger(methodId)) {
            return NextResponse.json({ error: "Invalid payment method id" }, { status: 400 })
        }

        const sql = await ensurePaymentMethodsSchema()
        const rows = await sql`DELETE FROM payment_methods WHERE id = ${methodId} RETURNING id`
        if (rows.length === 0) {
            return NextResponse.json({ error: "Payment method not found" }, { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("[Admin Payment Methods] Failed to delete method:", error)
        return NextResponse.json({ error: "Failed to delete payment method" }, { status: 500 })
    }
}