import { getDb } from '@/lib/db'

export async function ensureCredentialsInventoryTables() {
    const sql = getDb()

    await sql`
    CREATE TABLE IF NOT EXISTS buyer_credentials_inventory (
      id SERIAL PRIMARY KEY,
      product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      username TEXT,
      password TEXT,
      credential_data TEXT,
      assigned_to_buyer_id INT REFERENCES buyers(id) ON DELETE SET NULL,
      assigned_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `

    await sql`
    ALTER TABLE buyer_credentials_inventory
    ADD COLUMN IF NOT EXISTS username TEXT
  `

    await sql`
    ALTER TABLE buyer_credentials_inventory
    ADD COLUMN IF NOT EXISTS password TEXT
  `

    await sql`
    ALTER TABLE buyer_credentials_inventory
    ADD COLUMN IF NOT EXISTS credential_data TEXT
  `

    await sql`
    ALTER TABLE buyer_credentials_inventory
    ADD COLUMN IF NOT EXISTS assigned_to_buyer_id INT REFERENCES buyers(id) ON DELETE SET NULL
  `

    await sql`
    ALTER TABLE buyer_credentials_inventory
    ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP
  `

    await sql`
    ALTER TABLE buyer_credentials_inventory
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  `

    return sql
}

export async function ensureOrderCredentialsTable() {
    const sql = await ensureCredentialsInventoryTables()

    await sql`
    CREATE TABLE IF NOT EXISTS order_credentials (
      id SERIAL PRIMARY KEY,
      order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      credential_id INT NOT NULL REFERENCES buyer_credentials_inventory(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(order_id, credential_id)
    )
  `

    return sql
}

export function extractCredentialFields(row: {
    username?: unknown
    password?: unknown
    credential_data?: unknown
}) {
    const directUsername = typeof row.username === 'string' ? row.username : null
    const directPassword = typeof row.password === 'string' ? row.password : null

    if (directUsername || directPassword) {
        return {
            username: directUsername,
            password: directPassword,
        }
    }

    if (typeof row.credential_data !== 'string' || row.credential_data.trim().length === 0) {
        return { username: null, password: null }
    }

    try {
        const parsed = JSON.parse(row.credential_data) as Record<string, unknown>
        return {
            username: typeof parsed.username === 'string' ? parsed.username : null,
            password: typeof parsed.password === 'string' ? parsed.password : null,
        }
    } catch {
        return { username: null, password: null }
    }
}