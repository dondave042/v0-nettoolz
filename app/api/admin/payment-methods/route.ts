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

export async function GET() {
  const unauthorizedResponse = await requireAdmin()
  if (unauthorizedResponse) {
    return unauthorizedResponse
  }

  try {
    const sql = await ensurePaymentMethodsSchema()
    const methods = await sql`
      SELECT
        id,
        name,
        type,
        COALESCE(config, '{}'::jsonb) AS config,
        COALESCE(is_active, TRUE) AS is_active,
        COALESCE(sort_order, 0) AS sort_order,
        created_at,
        updated_at
      FROM payment_methods
      ORDER BY COALESCE(sort_order, 0) ASC, name ASC
    `

    return NextResponse.json({ methods })
  } catch (error) {
    console.error("[Admin Payment Methods] Failed to fetch methods:", error)
    return NextResponse.json({ error: "Failed to load payment methods" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const unauthorizedResponse = await requireAdmin()
  if (unauthorizedResponse) {
    return unauthorizedResponse
  }

  try {
    const sql = await ensurePaymentMethodsSchema()
    const { name, type, config, is_active, sort_order } = await request.json()

    if (!name || !type) {
      return NextResponse.json({ error: "Name and type are required" }, { status: 400 })
    }

    const rows = await sql`
      INSERT INTO payment_methods (name, type, config, is_active, sort_order, created_at, updated_at)
      VALUES (
        ${String(name).trim()},
        ${String(type).trim().toLowerCase()},
        ${JSON.stringify(config || {})}::jsonb,
        ${Boolean(is_active ?? true)},
        ${Number(sort_order ?? 0)},
        NOW(),
        NOW()
      )
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

    return NextResponse.json({ method: rows[0] }, { status: 201 })
  } catch (error) {
    console.error("[Admin Payment Methods] Failed to create method:", error)
    return NextResponse.json({ error: "Failed to create payment method" }, { status: 500 })
  }
}