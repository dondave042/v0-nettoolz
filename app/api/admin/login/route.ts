import { NextRequest, NextResponse } from "next/server"
import { authenticateAdmin } from "@/lib/admin-users"
import { createToken } from "@/lib/auth"

function buildAuthCookieResponse(payload: Record<string, unknown>, token: string) {
  const response = NextResponse.json(payload)
  response.cookies.set("admin_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  })
  return response
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const admin = await authenticateAdmin(String(email), String(password))
    if (!admin) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const token = await createToken({ id: admin.id, email: admin.email })
    return buildAuthCookieResponse({ success: true, admin }, token)
  } catch (error) {
    console.error("[Admin Login] Failed to sign in:", error)
    return NextResponse.json({ error: "Failed to sign in" }, { status: 500 })
  }
}