import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const sql = getDb()
    
    // Check if user has purchased this product
    const purchase = await sql`
      SELECT id FROM product_purchases
      WHERE product_id = ${parseInt(id)} AND user_id = ${session.user?.id}
    `

    if (purchase.length === 0) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get product credentials
    const product = await sql`
      SELECT product_username, product_password FROM products WHERE id = ${parseInt(id)}
    `

    if (product.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json({
      username: product[0].product_username,
      password: product[0].product_password,
    })
  } catch (error) {
    console.error("Credentials fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch credentials" }, { status: 500 })
  }
}
