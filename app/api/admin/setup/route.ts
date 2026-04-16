import { NextRequest, NextResponse } from "next/server"
import { createToken } from "@/lib/auth"
import { createAdminUser, getAdminUserCount, hasAdminUsers } from "@/lib/admin-users"

function createSetupResponse(payload: Record<string, unknown>, token: string) {
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

export async function GET() {
  const count = await getAdminUserCount()
  return NextResponse.json({ configured: count > 0, count })
}

export async function POST(request: NextRequest) {
  try {
    if (await hasAdminUsers()) {
      return NextResponse.json(
        { error: "Admin setup has already been completed" },
        { status: 409 },
      )
    }

    const { email, password } = await request.json()
    const normalizedEmail = String(email || "").trim().toLowerCase()
    const normalizedPassword = String(password || "")

    if (!normalizedEmail || !normalizedPassword) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    if (normalizedPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      )
    }

    const admin = await createAdminUser(normalizedEmail, normalizedPassword)
    const token = await createToken({ id: admin.id, email: admin.email })
    return createSetupResponse({ success: true, admin }, token)
  } catch (error) {
    console.error("[Admin Setup] Failed to create admin:", error)
    return NextResponse.json({ error: "Failed to create admin account" }, { status: 500 })
  }
}