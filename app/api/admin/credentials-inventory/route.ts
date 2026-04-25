import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { ensureCredentialsInventoryTables, extractCredentialFields } from '@/lib/credentials-inventory'

type InventoryColumnRow = {
  column_name: string
}

type RawCredentialInput = {
  username?: unknown
  password?: unknown
}

type InventoryRow = {
  id: number
  product_id: number
  username?: unknown
  password?: unknown
  credential_data?: unknown
  assigned_to_buyer_id: number | null
  distributed_to_buyer_id?: number | null
  created_at: string
}

async function getInventoryColumnSet(sql: Awaited<ReturnType<typeof ensureCredentialsInventoryTables>>) {
  const columns = await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'buyer_credentials_inventory'
  `

  return new Set(columns.map((row) => (row as InventoryColumnRow).column_name))
}

function getAssignedBuyerId(row: InventoryRow) {
  return row.assigned_to_buyer_id ?? row.distributed_to_buyer_id ?? null
}

function mapInventoryRow(row: InventoryRow) {
  const credential = extractCredentialFields(row)

  return {
    id: row.id,
    product_id: row.product_id,
    username: credential.username,
    password: credential.password,
    assigned_to_buyer_id: getAssignedBuyerId(row),
    created_at: row.created_at,
  }
}

async function syncProductStock(
  sql: Awaited<ReturnType<typeof ensureCredentialsInventoryTables>>,
  productId: number
) {
  const columnSet = await getInventoryColumnSet(sql)
  const hasDistributedToBuyerId = columnSet.has('distributed_to_buyer_id')

  const countRows = hasDistributedToBuyerId
    ? await sql`
        SELECT COUNT(*) AS count
        FROM buyer_credentials_inventory
        WHERE product_id = ${productId}
          AND assigned_to_buyer_id IS NULL
          AND distributed_to_buyer_id IS NULL
      `
    : await sql`
        SELECT COUNT(*) AS count
        FROM buyer_credentials_inventory
        WHERE product_id = ${productId}
          AND assigned_to_buyer_id IS NULL
      `

  const unassignedCount = Number(countRows[0]?.count ?? 0)

  await sql`
    UPDATE products
    SET available_qty = ${unassignedCount}, updated_at = NOW()
    WHERE id = ${productId}
  `
}

function normalizeCredentials(credentials: RawCredentialInput[]) {
  return credentials.reduce<Array<{ username: string; password: string }>>((accumulator, credential) => {
    const username = typeof credential.username === 'string' ? credential.username.trim() : ''
    const password = typeof credential.password === 'string' ? credential.password.trim() : ''

    if (username && password) {
      accumulator.push({ username, password })
    }

    return accumulator
  }, [])
}

export async function GET(request: Request) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const product_id = searchParams.get('product_id')

    const sql = await ensureCredentialsInventoryTables()
    const columnSet = await getInventoryColumnSet(sql)
    const hasDistributedToBuyerId = columnSet.has('distributed_to_buyer_id')

    if (product_id) {
      const inventory = hasDistributedToBuyerId
        ? await sql`
            SELECT id, product_id, username, password, credential_data, assigned_to_buyer_id, distributed_to_buyer_id, created_at
            FROM buyer_credentials_inventory
            WHERE product_id = ${parseInt(product_id)}
            ORDER BY COALESCE(assigned_to_buyer_id, distributed_to_buyer_id) DESC NULLS FIRST, created_at DESC
          `
        : await sql`
            SELECT id, product_id, username, password, credential_data, assigned_to_buyer_id, created_at
            FROM buyer_credentials_inventory
            WHERE product_id = ${parseInt(product_id)}
            ORDER BY assigned_to_buyer_id DESC NULLS FIRST, created_at DESC
          `

      return NextResponse.json({
        inventory: inventory.map((row) => mapInventoryRow(row as InventoryRow)),
      })
    }

    const inventory = hasDistributedToBuyerId
      ? await sql`
          SELECT id, product_id, username, password, credential_data, assigned_to_buyer_id, distributed_to_buyer_id, created_at
          FROM buyer_credentials_inventory
          ORDER BY COALESCE(assigned_to_buyer_id, distributed_to_buyer_id) DESC NULLS FIRST, created_at DESC
        `
      : await sql`
          SELECT id, product_id, username, password, credential_data, assigned_to_buyer_id, created_at
          FROM buyer_credentials_inventory
          ORDER BY assigned_to_buyer_id DESC NULLS FIRST, created_at DESC
        `

    return NextResponse.json({
      inventory: inventory.map((row) => mapInventoryRow(row as InventoryRow)),
    })
  } catch (error) {
    console.error('Get credentials inventory error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch credentials inventory' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { product_id, credentials } = await request.json()
    const parsedProductId = Number(product_id)

    if (!Number.isInteger(parsedProductId) || parsedProductId <= 0 || !Array.isArray(credentials)) {
      return NextResponse.json(
        { error: 'Product ID and credentials array are required' },
        { status: 400 }
      )
    }

    const normalizedCredentials = normalizeCredentials(credentials)

    if (normalizedCredentials.length === 0) {
      return NextResponse.json(
        { error: 'At least one complete username and password pair is required' },
        { status: 400 }
      )
    }

    const sql = await ensureCredentialsInventoryTables()
    const columnSet = await getInventoryColumnSet(sql)
    const hasCredentialsIndex = columnSet.has('credentials_index')

    // Verify product exists
    const products = await sql`
      SELECT id FROM products WHERE id = ${parsedProductId}
    `

    if (products.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Insert all credentials for the product
    const inserted = []
    let nextCredentialsIndex = 0

    if (hasCredentialsIndex) {
      const nextIndexRows = await sql`
        SELECT COALESCE(MAX(credentials_index), 0) AS max_index
        FROM buyer_credentials_inventory
        WHERE product_id = ${parsedProductId}
      `

      nextCredentialsIndex = Number(nextIndexRows[0]?.max_index ?? 0)
    }

    for (const cred of normalizedCredentials) {
      const result = hasCredentialsIndex
        ? await sql`
            INSERT INTO buyer_credentials_inventory (product_id, credentials_index, username, password, credential_data)
            VALUES (
              ${parsedProductId},
              ${nextCredentialsIndex + 1},
              ${cred.username},
              ${cred.password},
              ${JSON.stringify({ username: cred.username, password: cred.password })}
            )
            RETURNING id, product_id, username, password, credential_data, assigned_to_buyer_id, created_at
          `
        : await sql`
            INSERT INTO buyer_credentials_inventory (product_id, username, password, credential_data)
            VALUES (
              ${parsedProductId},
              ${cred.username},
              ${cred.password},
              ${JSON.stringify({ username: cred.username, password: cred.password })}
            )
            RETURNING id, product_id, username, password, credential_data, assigned_to_buyer_id, created_at
          `

      nextCredentialsIndex += 1
      inserted.push(mapInventoryRow(result[0] as InventoryRow))
    }

    // Sync product stock to match unassigned credentials count
    await syncProductStock(sql, parsedProductId)

    return NextResponse.json(
      { inserted, count: inserted.length },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create credentials error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add credentials' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      )
    }

    const sql = await ensureCredentialsInventoryTables()
    const columnSet = await getInventoryColumnSet(sql)
    const hasDistributedToBuyerId = columnSet.has('distributed_to_buyer_id')

    // Check if credential is assigned
    const cred = hasDistributedToBuyerId
      ? await sql`
          SELECT assigned_to_buyer_id, distributed_to_buyer_id
          FROM buyer_credentials_inventory
          WHERE id = ${id}
        `
      : await sql`
          SELECT assigned_to_buyer_id
          FROM buyer_credentials_inventory
          WHERE id = ${id}
        `

    if (cred.length === 0) {
      return NextResponse.json(
        { error: 'Credential not found' },
        { status: 404 }
      )
    }

    if (getAssignedBuyerId(cred[0] as InventoryRow) !== null) {
      return NextResponse.json(
        { error: 'Cannot delete assigned credentials' },
        { status: 400 }
      )
    }

    const deleted = await sql`
      DELETE FROM buyer_credentials_inventory WHERE id = ${id} RETURNING product_id
    `

    const productId = Number((deleted[0] as { product_id: number })?.product_id)
    if (productId) {
      await syncProductStock(sql, productId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete credential error:', error)
    return NextResponse.json(
      { error: 'Failed to delete credential' },
      { status: 500 }
    )
  }
}
