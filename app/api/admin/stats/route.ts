import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sql = getDb()

  const [products] = await sql`SELECT COUNT(*)::int as count FROM products`
  const [categories] = await sql`SELECT COUNT(*)::int as count FROM categories`
  const [orders] = await sql`SELECT COUNT(*)::int as count FROM orders`
  const [announcements] = await sql`SELECT COUNT(*)::int as count FROM announcements WHERE is_active = true`
  const [totalStock] = await sql`SELECT COALESCE(SUM(available_qty), 0)::int as total FROM products`

  return NextResponse.json({
    products: products.count,
    categories: categories.count,
    orders: orders.count,
    announcements: announcements.count,
    totalStock: totalStock.total,
  })
}
