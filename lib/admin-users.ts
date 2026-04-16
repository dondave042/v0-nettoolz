import { getDb } from "@/lib/db"
import { hashPassword, verifyPassword } from "@/lib/auth"

type AdminUserRow = {
  id: number
  email: string
  password_hash: string
  created_at: string
}

export async function ensureAdminUsersTable() {
  const sql = getDb()

  await sql`
    CREATE TABLE IF NOT EXISTS admin_users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `

  return sql
}

export async function getAdminUserCount() {
  const sql = await ensureAdminUsersTable()
  const [row] = await sql`SELECT COUNT(*)::int AS count FROM admin_users`
  return row?.count ?? 0
}

export async function hasAdminUsers() {
  return (await getAdminUserCount()) > 0
}

export async function getAdminByEmail(email: string) {
  const sql = await ensureAdminUsersTable()
  const rows = await sql`
    SELECT id, email, password_hash, created_at
    FROM admin_users
    WHERE LOWER(email) = LOWER(${email.trim()})
    LIMIT 1
  `

  return (rows[0] as AdminUserRow | undefined) ?? null
}

export async function authenticateAdmin(email: string, password: string) {
  const admin = await getAdminByEmail(email)
  if (!admin) {
    return null
  }

  const passwordMatches = await verifyPassword(password, admin.password_hash)
  if (!passwordMatches) {
    return null
  }

  return {
    id: admin.id,
    email: admin.email,
  }
}

export async function createAdminUser(email: string, password: string) {
  const sql = await ensureAdminUsersTable()
  const normalizedEmail = email.trim().toLowerCase()
  const existingAdmin = await getAdminByEmail(normalizedEmail)

  if (existingAdmin) {
    throw new Error("An admin user with that email already exists")
  }

  const passwordHash = await hashPassword(password)
  const rows = await sql`
    INSERT INTO admin_users (email, password_hash)
    VALUES (${normalizedEmail}, ${passwordHash})
    RETURNING id, email, created_at
  `

  return rows[0] as Omit<AdminUserRow, "password_hash">
}