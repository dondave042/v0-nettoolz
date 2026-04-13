import { getDb } from '@/lib/db'

export async function ensureBalanceAdjustmentsTable() {
  const sql = getDb()

  await sql`
    CREATE TABLE IF NOT EXISTS balance_adjustments (
      id SERIAL PRIMARY KEY,
      buyer_id INT NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
      admin_user_id INT,
      admin_email VARCHAR(255),
      amount DECIMAL(10, 2) NOT NULL,
      reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `

  return sql
}

export async function createBalanceAdjustment(input: {
  buyerId: number
  adminUserId?: number | null
  adminEmail?: string | null
  amount: number
  reason?: string | null
}) {
  const sql = await ensureBalanceAdjustmentsTable()

  const rows = await sql`
    INSERT INTO balance_adjustments (
      buyer_id,
      admin_user_id,
      admin_email,
      amount,
      reason
    )
    VALUES (
      ${input.buyerId},
      ${input.adminUserId ?? null},
      ${input.adminEmail ?? null},
      ${input.amount},
      ${input.reason ?? null}
    )
    RETURNING id, buyer_id, admin_user_id, admin_email, amount, reason, created_at
  `

  return rows[0]
}