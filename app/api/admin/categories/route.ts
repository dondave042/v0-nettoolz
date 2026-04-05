import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sql = getDb()
  const categories = await sql`SELECT * FROM categories ORDER BY sort_order`
  return NextResponse.json(categories)
}
