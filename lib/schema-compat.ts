import { getDb } from './db'

type SqlClient = ReturnType<typeof getDb>

const columnCache = new Map<string, boolean>()

async function hasColumn(
  sql: SqlClient,
  tableName: string,
  columnName: string
): Promise<boolean> {
  const cacheKey = `${tableName}.${columnName}`

  if (columnCache.has(cacheKey)) {
    return columnCache.get(cacheKey) ?? false
  }

  const rows = await sql`
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = ${tableName}
      AND column_name = ${columnName}
    LIMIT 1
  `

  const exists = rows.length > 0
  columnCache.set(cacheKey, exists)
  return exists
}

export async function applyBuyerBalanceDelta(
  sql: SqlClient,
  buyerId: number,
  delta: number
) {
  const hasUpdatedAt = await hasColumn(sql, 'buyers', 'updated_at')

  if (hasUpdatedAt) {
    await sql`
      UPDATE buyers
      SET balance = balance + ${delta}, updated_at = NOW()
      WHERE id = ${buyerId}
    `
    return
  }

  await sql`
    UPDATE buyers
    SET balance = balance + ${delta}
    WHERE id = ${buyerId}
  `
}

export async function createPendingDeposit(
  sql: SqlClient,
  input: { buyerId: number; amount: number; referenceId: string }
) {
  const hasUpdatedAt = await hasColumn(sql, 'deposits', 'updated_at')

  if (hasUpdatedAt) {
    await sql`
      INSERT INTO deposits (buyer_id, amount, reference_id, status, created_at, updated_at)
      VALUES (${input.buyerId}, ${input.amount}, ${input.referenceId}, 'pending', NOW(), NOW())
    `
    return
  }

  await sql`
    INSERT INTO deposits (buyer_id, amount, reference_id, status, created_at)
    VALUES (${input.buyerId}, ${input.amount}, ${input.referenceId}, 'pending', NOW())
  `
}

export async function setDepositStatus(
  sql: SqlClient,
  identifier: number | string,
  status: string,
  lookupColumn: 'id' | 'reference_id' = 'id'
) {
  const hasUpdatedAt = await hasColumn(sql, 'deposits', 'updated_at')

  if (lookupColumn === 'reference_id') {
    if (hasUpdatedAt) {
      await sql`
        UPDATE deposits
        SET status = ${status}, updated_at = NOW()
        WHERE reference_id = ${String(identifier)}
      `
      return
    }

    await sql`
      UPDATE deposits
      SET status = ${status}
      WHERE reference_id = ${String(identifier)}
    `
    return
  }

  if (hasUpdatedAt) {
    await sql`
      UPDATE deposits
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${Number(identifier)}
    `
    return
  }

  await sql`
    UPDATE deposits
    SET status = ${status}
    WHERE id = ${Number(identifier)}
  `
}