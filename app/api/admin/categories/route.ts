import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
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

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sql = getDb()
  const categories = await sql`SELECT * FROM categories ORDER BY sort_order`
  return NextResponse.json(categories)
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
