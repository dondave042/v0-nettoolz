import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
<<<<<<< HEAD
import { getSession } from "@/lib/auth"
import { getAdminSession } from "@/lib/admin-auth"

const rolesAllowedToManageCatalog = new Set([
  "admin",
  "super_admin",
  "editor",
  "manager",
  "support",
])

function canManageCatalog(role?: string) {
  if (!role) {
    return true
  }

  return rolesAllowedToManageCatalog.has(role)
}
=======
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
>>>>>>> 0f2e7110f829d189f9832deeba380d8d919a4c03

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}
<<<<<<< HEAD
=======

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
>>>>>>> 0f2e7110f829d189f9832deeba380d8d919a4c03

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
    const formData = await request.formData()
    const name = formData.get("name")
    const description = formData.get("description")
    const iconFile = formData.get("icon") as File | null

    const trimmed = typeof name === "string" ? name.trim().toUpperCase() : ""
    if (!trimmed) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 })
    }

    const desc = typeof description === "string" ? description.trim() || null : null
    const slug = slugify(trimmed)

    if (!slug) {
      return NextResponse.json({ error: "Category slug is required" }, { status: 400 })
    }

    let iconBase64: string | null = null
    if (iconFile && iconFile.size > 0) {
      const buffer = await iconFile.arrayBuffer()
      iconBase64 = Buffer.from(buffer).toString("base64")
      const mimeType = iconFile.type || "image/png"
      iconBase64 = `data:${mimeType};base64,${iconBase64}`
    }

    const sql = getDb()
    const maxRow = await sql`SELECT COALESCE(MAX(sort_order), 0) AS max FROM categories`
    const nextOrder = Number((maxRow[0] as { max: number }).max) + 1

    const result = await sql`
      INSERT INTO categories (name, slug, description, sort_order, icon)
      VALUES (${trimmed}, ${slug}, ${desc}, ${nextOrder}, ${iconBase64})
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
    const formData = await request.formData()
    const id = formData.get("id")
    const name = formData.get("name")
    const description = formData.get("description")
    const iconFile = formData.get("icon") as File | null

    const trimmed = typeof name === "string" ? name.trim().toUpperCase() : ""
    if (!id || !trimmed) {
      return NextResponse.json({ error: "ID and name are required" }, { status: 400 })
    }

    const desc = typeof description === "string" ? description.trim() || null : null
    const slug = slugify(trimmed)

    if (!slug) {
      return NextResponse.json({ error: "Category slug is required" }, { status: 400 })
    }

    let iconBase64: string | null = undefined
    if (iconFile && iconFile.size > 0) {
      const buffer = await iconFile.arrayBuffer()
      iconBase64 = Buffer.from(buffer).toString("base64")
      const mimeType = iconFile.type || "image/png"
      iconBase64 = `data:${mimeType};base64,${iconBase64}`
    }

    const sql = getDb()
    let updateQuery: string
    if (iconBase64 !== undefined) {
      updateQuery = `
        UPDATE categories 
        SET name = $1, slug = $2, description = $3, icon = $4, updated_at = NOW()
        WHERE id = $5
        RETURNING *
      `
    } else {
      updateQuery = `
        UPDATE categories 
        SET name = $1, slug = $2, description = $3, updated_at = NOW()
        WHERE id = $4
        RETURNING *
      `
    }
    
    const result = iconBase64 !== undefined
      ? await sql.unsafe(updateQuery, [trimmed, slug, desc, iconBase64, id])
      : await sql.unsafe(updateQuery, [trimmed, slug, desc, id])
    
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

export async function POST(request: Request) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!canManageCatalog(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const name = String(body?.name || "").trim()
    if (!name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 })
    }

    const slugInput = String(body?.slug || "").trim()
    const slug = slugify(slugInput || name)
    if (!slug) {
      return NextResponse.json({ error: "Category slug is required" }, { status: 400 })
    }
    const description = typeof body?.description === "string" ? body.description.trim() : null
    const icon = typeof body?.icon === "string" ? body.icon.trim() : null
    const sortOrderRaw = body?.sort_order
    const sortOrder = Number.isFinite(Number(sortOrderRaw)) ? parseInt(sortOrderRaw, 10) : null

    const sql = getDb()
    const result = await sql`
      INSERT INTO categories (name, slug, description, icon, sort_order)
      VALUES (${name}, ${slug}, ${description || null}, ${icon || null}, ${sortOrder})
      RETURNING *
    `
    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Create category error:", error)
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 })
  }
}
