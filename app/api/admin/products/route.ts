import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getAdminSession } from "@/lib/admin-auth"
import { ensureCredentialsInventoryTables } from "@/lib/credentials-inventory"

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

type RawCredentialInput = {
  username?: unknown
  password?: unknown
}

function normalizeCredentials(credentials: RawCredentialInput[]) {
  return credentials.reduce<Array<{ username: string; password: string }>>((accumulator, credential) => {
    const username = typeof credential.username === "string" ? credential.username.trim() : ""
    const password = typeof credential.password === "string" ? credential.password.trim() : ""

    if (username && password) {
      accumulator.push({ username, password })
    }

    return accumulator
  }, [])
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
    const {
      sku,
      name,
      description,
      price,
      available_qty,
      category_id,
      badge,
      is_featured,
      images,
      product_username,
      product_password,
      accounts,
    } = body

    const normalizedCredentials = Array.isArray(accounts)
      ? normalizeCredentials(accounts as RawCredentialInput[])
      : []
    const initialQty = normalizedCredentials.length > 0 ? normalizedCredentials.length : parseInt(available_qty)
    const fallbackUsername = normalizedCredentials[0]?.username ?? product_username ?? null
    const fallbackPassword = normalizedCredentials[0]?.password ?? product_password ?? null

    const sql = await ensureCredentialsInventoryTables()
    const result = await sql`
      INSERT INTO products (sku, name, description, price, available_qty, category_id, badge, is_featured, images, product_username, product_password)
      VALUES (${sku}, ${name}, ${description}, ${parseFloat(price)}, ${initialQty}, ${category_id || null}, ${badge || null}, ${is_featured || false}, ${images ? JSON.stringify(images) : null}, ${fallbackUsername}, ${fallbackPassword})
      RETURNING *
    `

    let createdProduct = result[0]

    if (normalizedCredentials.length > 0) {
      const productId = Number(createdProduct.id)

      const credentialColumns = await sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'buyer_credentials_inventory'
      `
      const hasCredentialsIndex = credentialColumns.some((row) => (row as { column_name: string }).column_name === "credentials_index")

      let nextCredentialsIndex = 0
      if (hasCredentialsIndex) {
        const nextIndexRows = await sql`
          SELECT COALESCE(MAX(credentials_index), 0) AS max_index
          FROM buyer_credentials_inventory
          WHERE product_id = ${productId}
        `
        nextCredentialsIndex = Number(nextIndexRows[0]?.max_index ?? 0)
      }

      for (const credential of normalizedCredentials) {
        if (hasCredentialsIndex) {
          await sql`
            INSERT INTO buyer_credentials_inventory (product_id, credentials_index, username, password, credential_data)
            VALUES (
              ${productId},
              ${nextCredentialsIndex + 1},
              ${credential.username},
              ${credential.password},
              ${JSON.stringify({ username: credential.username, password: credential.password })}
            )
          `
          nextCredentialsIndex += 1
        } else {
          await sql`
            INSERT INTO buyer_credentials_inventory (product_id, username, password, credential_data)
            VALUES (
              ${productId},
              ${credential.username},
              ${credential.password},
              ${JSON.stringify({ username: credential.username, password: credential.password })}
            )
          `
        }
      }

      const synced = await sql`
        UPDATE products
        SET available_qty = (
          SELECT COUNT(*) FROM buyer_credentials_inventory
          WHERE product_id = ${productId} AND assigned_to_buyer_id IS NULL
        )
        WHERE id = ${productId}
        RETURNING *
      `

      createdProduct = synced[0] || createdProduct
    }

    return NextResponse.json(createdProduct, { status: 201 })
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
