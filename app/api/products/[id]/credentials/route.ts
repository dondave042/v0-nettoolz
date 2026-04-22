import { NextResponse } from "next/server"
import { getBuyerSession } from "@/lib/buyer-auth"
import { ensureOrderCredentialsTable, extractCredentialFields } from '@/lib/credentials-inventory'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const buyer = await getBuyerSession()
  if (!buyer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const sql = await ensureOrderCredentialsTable()

    // Check if buyer has purchased this product
    const purchase = await sql`
      SELECT id FROM orders
      WHERE product_id = ${parseInt(id)} AND buyer_id = ${buyer.id}
      AND payment_status = 'completed'
      ORDER BY payment_completed_at DESC NULLS LAST, created_at DESC
      LIMIT 1
    `

    if (purchase.length === 0) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const assignedCredentials = await sql`
      SELECT bci.username, bci.password, bci.credential_data
      FROM order_credentials oc
      JOIN buyer_credentials_inventory bci ON bci.id = oc.credential_id
      WHERE oc.order_id = ${purchase[0].id}
      ORDER BY oc.created_at ASC
      LIMIT 1
    `

    if (assignedCredentials.length > 0) {
      const credential = extractCredentialFields(assignedCredentials[0])

      return NextResponse.json({
        username: credential.username,
        password: credential.password,
      })
    }

    // Fallback to product-level shared credentials if no assigned inventory exists
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
