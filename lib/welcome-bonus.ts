import { getDb } from '@/lib/db'

const DEFAULT_WELCOME_BONUS = 1000
const BONUS_SETTING_KEY = 'buyer_welcome_bonus'

async function ensureSettingsTable() {
  const sql = getDb()

  await sql`
    CREATE TABLE IF NOT EXISTS app_settings (
      key VARCHAR(100) PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS app_settings_audit (
      id SERIAL PRIMARY KEY,
      setting_key VARCHAR(100) NOT NULL,
      old_value TEXT,
      new_value TEXT NOT NULL,
      changed_by_admin_id INT,
      changed_by_email VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `

  return sql
}

function normalizeBonus(value: number) {
  if (!Number.isFinite(value) || value < 0) {
    return DEFAULT_WELCOME_BONUS
  }

  return Math.round(value * 100) / 100
}

export function getWelcomeBonusFallback() {
  const rawBonus = process.env.BUYER_WELCOME_BONUS
  const parsedBonus = rawBonus ? Number(rawBonus) : DEFAULT_WELCOME_BONUS
  return normalizeBonus(parsedBonus)
}

export async function getBuyerWelcomeBonus() {
  const sql = await ensureSettingsTable()
  const [setting] = await sql`
    SELECT value FROM app_settings WHERE key = ${BONUS_SETTING_KEY} LIMIT 1
  `

  if (!setting) {
    return getWelcomeBonusFallback()
  }

  return normalizeBonus(Number(setting.value))
}

export async function setBuyerWelcomeBonus(value: number) {
  const sql = await ensureSettingsTable()
  const normalizedValue = normalizeBonus(value)
  const [existing] = await sql`
    SELECT value FROM app_settings WHERE key = ${BONUS_SETTING_KEY} LIMIT 1
  `

  await sql`
    INSERT INTO app_settings (key, value, updated_at)
    VALUES (${BONUS_SETTING_KEY}, ${String(normalizedValue)}, NOW())
    ON CONFLICT (key)
    DO UPDATE SET value = ${String(normalizedValue)}, updated_at = NOW()
  `

  return normalizedValue
}

export async function updateBuyerWelcomeBonus(
  value: number,
  actor?: { id: number; email: string } | null,
) {
  const sql = await ensureSettingsTable()
  const normalizedValue = normalizeBonus(value)
  const [existing] = await sql`
    SELECT value FROM app_settings WHERE key = ${BONUS_SETTING_KEY} LIMIT 1
  `
  const previousValue = existing?.value ?? null

  await sql`
    INSERT INTO app_settings (key, value, updated_at)
    VALUES (${BONUS_SETTING_KEY}, ${String(normalizedValue)}, NOW())
    ON CONFLICT (key)
    DO UPDATE SET value = ${String(normalizedValue)}, updated_at = NOW()
  `

  await sql`
    INSERT INTO app_settings_audit (
      setting_key,
      old_value,
      new_value,
      changed_by_admin_id,
      changed_by_email
    )
    VALUES (
      ${BONUS_SETTING_KEY},
      ${previousValue},
      ${String(normalizedValue)},
      ${actor?.id ?? null},
      ${actor?.email ?? null}
    )
  `

  return normalizedValue
}

export async function getBuyerWelcomeBonusAudit(limit = 10) {
  const sql = await ensureSettingsTable()
  const rows = await sql`
    SELECT id, old_value, new_value, changed_by_admin_id, changed_by_email, created_at
    FROM app_settings_audit
    WHERE setting_key = ${BONUS_SETTING_KEY}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `

  return rows.map((row) => ({
    id: row.id,
    old_value: row.old_value,
    new_value: row.new_value,
    changed_by_admin_id: row.changed_by_admin_id,
    changed_by_email: row.changed_by_email,
    created_at: row.created_at,
  }))
}