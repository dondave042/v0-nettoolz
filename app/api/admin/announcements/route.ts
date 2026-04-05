import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sql = getDb()
  const announcements = await sql`SELECT * FROM announcements ORDER BY created_at DESC`
  return NextResponse.json(announcements)
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { title, content, is_active } = await request.json()
    const sql = getDb()
    const result = await sql`
      INSERT INTO announcements (title, content, is_active)
      VALUES (${title}, ${content}, ${is_active ?? true})
      RETURNING *
    `
    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Create announcement error:", error)
    return NextResponse.json({ error: "Failed to create announcement" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id, title, content, is_active } = await request.json()
    const sql = getDb()
    const result = await sql`
      UPDATE announcements SET title = ${title}, content = ${content}, is_active = ${is_active}
      WHERE id = ${id}
      RETURNING *
    `
    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Update announcement error:", error)
    return NextResponse.json({ error: "Failed to update announcement" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

    const sql = getDb()
    await sql`DELETE FROM announcements WHERE id = ${parseInt(id)}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete announcement error:", error)
    return NextResponse.json({ error: "Failed to delete announcement" }, { status: 500 })
  }
}
