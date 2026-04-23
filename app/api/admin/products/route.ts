import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
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

export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sql = getDb()
  const products = await sql`
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY p.created_at DESC
  `
  return NextResponse.json(products)
}

export async function POST(request: Request) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!canManageCatalog(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { sku, name, description, price, available_qty, category_id, badge, is_featured, images, product_username, product_password } = body

    const sql = getDb()
    const result = await sql`
      INSERT INTO products (sku, name, description, price, available_qty, category_id, badge, is_featured, images, product_username, product_password)
      VALUES (${sku}, ${name}, ${description}, ${parseFloat(price)}, ${parseInt(available_qty)}, ${category_id || null}, ${badge || null}, ${is_featured || false}, ${images ? JSON.stringify(images) : null}, ${product_username || null}, ${product_password || null})
      RETURNING *
    `
    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Create product error:", error)
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!canManageCatalog(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { id, sku, name, description, price, available_qty, category_id, badge, is_featured, images, product_username, product_password } = body

    const sql = getDb()
    const result = await sql`
      UPDATE products
      SET sku = ${sku}, name = ${name}, description = ${description}, price = ${parseFloat(price)},
          available_qty = ${parseInt(available_qty)}, category_id = ${category_id || null},
          badge = ${badge || null}, is_featured = ${is_featured || false}, 
          images = ${images ? JSON.stringify(images) : null}, 
          product_username = ${product_username || null}, 
          product_password = ${product_password || null},
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `
    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Update product error:", error)
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!canManageCatalog(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const deleteAll = searchParams.get("all")
    const id = searchParams.get("id")

    const sql = getDb()

    if (deleteAll === "true") {
      const deleted = await sql`DELETE FROM products RETURNING id`
      return NextResponse.json({ success: true, deletedCount: deleted.length })
    }

    if (!id) return NextResponse.json({ error: "Product ID required" }, { status: 400 })

    await sql`DELETE FROM products WHERE id = ${parseInt(id)}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete product error:", error)
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}
