import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getAdminSession } from "@/lib/admin-auth"

const DEFAULT_CATEGORIES = [
  "APPLE ID",
  "ESIM",
  "FACEBOOK INSTAGRAM",
  "TWITTER",
  "PROXY",
  "VPN",
  "WHATSAPP",
]

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

async function ensureDefaultCategories(sql: ReturnType<typeof getDb>) {
  const existing = await sql`SELECT name FROM categories`
  const existingNames = new Set((existing as { name: string }[]).map((r) => r.name.toUpperCase()))

  for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
    const name = DEFAULT_CATEGORIES[i]
    if (!existingNames.has(name)) {
      const slug = slugify(name)
      await sql`
        INSERT INTO categories (name, slug, sort_order)
        VALUES (${name}, ${slug}, ${i + 1})
        ON CONFLICT (name) DO NOTHING
      `
    }
  }
}

export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const sql = getDb()
    await ensureDefaultCategories(sql)
    const categories = await sql`SELECT id, name, description, sort_order FROM categories ORDER BY sort_order, name`
    return NextResponse.json(categories)
  } catch (error) {
    console.error("[v0] Categories GET error:", error)
    const msg = error instanceof Error ? error.message : "Failed to load categories"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { name, description, slug: slugInput } = await request.json()
    const trimmed = typeof name === "string" ? name.trim().toUpperCase() : ""
    if (!trimmed) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 })
    }

    const desc = typeof description === "string" ? description.trim() || null : null
    const slug = typeof slugInput === "string" && slugInput.trim()
      ? slugify(slugInput)
      : slugify(trimmed)

    if (!slug) {
      return NextResponse.json({ error: "Category slug is required" }, { status: 400 })
    }

    const sql = getDb()
    const maxRow = await sql`SELECT COALESCE(MAX(sort_order), 0) AS max FROM categories`
    const nextOrder = Number((maxRow[0] as { max: number }).max) + 1

    const result = await sql`
      INSERT INTO categories (name, slug, description, sort_order)
      VALUES (${trimmed}, ${slug}, ${desc}, ${nextOrder})
      RETURNING *
    `
    return NextResponse.json(result[0], { status: 201 })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create category"
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return NextResponse.json({ error: "Category already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id, name, description, slug: slugInput } = await request.json()
    const trimmed = typeof name === "string" ? name.trim().toUpperCase() : ""
    if (!id || !trimmed) {
      return NextResponse.json({ error: "ID and name are required" }, { status: 400 })
    }

    const desc = typeof description === "string" ? description.trim() || null : null
    const slug = typeof slugInput === "string" && slugInput.trim()
      ? slugify(slugInput)
      : slugify(trimmed)

    if (!slug) {
      return NextResponse.json({ error: "Category slug is required" }, { status: 400 })
    }

    const sql = getDb()
    const result = await sql`
      UPDATE categories 
      SET name = ${trimmed}, slug = ${slug}, description = ${desc}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `
    if (result.length === 0) return NextResponse.json({ error: "Category not found" }, { status: 404 })
    return NextResponse.json(result[0])
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update category"
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return NextResponse.json({ error: "Category name already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 })

    const sql = getDb()

    // Check if any products reference this category
    const products = await sql`SELECT id FROM products WHERE category_id = ${id} LIMIT 1`
    if (products.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete: products are assigned to this category" },
        { status: 409 }
      )
    }

    await sql`DELETE FROM categories WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete category" },
      { status: 500 }
    )
  }
}
