import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'

export async function GET(request: Request) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const product_id = searchParams.get('product_id')

    const sql = getDb()

    let query = 'SELECT id, product_id, username, password, assigned_to_buyer_id, created_at FROM buyer_credentials_inventory'

    if (product_id) {
      const inventory = await sql`
        SELECT id, product_id, username, password, assigned_to_buyer_id, created_at
        FROM buyer_credentials_inventory
        WHERE product_id = ${parseInt(product_id)}
        ORDER BY assigned_to_buyer_id DESC NULLS FIRST, created_at DESC
      `

      return NextResponse.json({ inventory })
    }

    const inventory = await sql`
      SELECT id, product_id, username, password, assigned_to_buyer_id, created_at
      FROM buyer_credentials_inventory
      ORDER BY assigned_to_buyer_id DESC NULLS FIRST, created_at DESC
    `

    return NextResponse.json({ inventory })
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

    if (!product_id || !credentials || !Array.isArray(credentials)) {
      return NextResponse.json(
        { error: 'Product ID and credentials array are required' },
        { status: 400 }
      )
    }

    const sql = getDb()

    // Verify product exists
    const products = await sql`
      SELECT id FROM products WHERE id = ${product_id}
    `

    if (products.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Insert all credentials for the product
    const inserted = []
    for (const cred of credentials) {
      if (!cred.username || !cred.password) {
        continue
      }

      const result = await sql`
        INSERT INTO buyer_credentials_inventory (product_id, username, password)
        VALUES (${product_id}, ${cred.username}, ${cred.password})
        RETURNING id, product_id, username, password, assigned_to_buyer_id, created_at
      `

      inserted.push(result[0])
    }

    return NextResponse.json(
      { inserted, count: inserted.length },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create credentials error:', error)
    return NextResponse.json(
      { error: 'Failed to add credentials' },
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

    const sql = getDb()

    // Check if credential is assigned
    const cred = await sql`
      SELECT assigned_to_buyer_id FROM buyer_credentials_inventory WHERE id = ${id}
    `

    if (cred.length === 0) {
      return NextResponse.json(
        { error: 'Credential not found' },
        { status: 404 }
      )
    }

    if (cred[0].assigned_to_buyer_id !== null) {
      return NextResponse.json(
        { error: 'Cannot delete assigned credentials' },
        { status: 400 }
      )
    }

    await sql`
      DELETE FROM buyer_credentials_inventory WHERE id = ${id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete credential error:', error)
    return NextResponse.json(
      { error: 'Failed to delete credential' },
      { status: 500 }
    )
  }
}
