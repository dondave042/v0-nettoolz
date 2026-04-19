import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { getDb } from '@/lib/db'

// GET /api/admin/products — list all products with stock and credential counts
export async function GET() {
    if (!(await isAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    try {
        const sql = getDb()
        const products = await sql`
      SELECT
        p.id,
        p.name,
        p.description,
        p.price,
        p.available_qty,
        COUNT(bci.id)::int                                                    AS total_credentials,
        COUNT(CASE WHEN bci.assigned_to_buyer_id IS NULL THEN 1 END)::int     AS unassigned_credentials,
        p.created_at
      FROM products p
      LEFT JOIN buyer_credentials_inventory bci ON bci.product_id = p.id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `
        return NextResponse.json({ products })
    } catch (error) {
        console.error('[Admin/Products] GET error:', error)
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }
}

// POST /api/admin/products
// Body: { name, description, price, quantity, credentials: string[] }
// credentials is an array of credential strings, one per unit of the product.
// The array length should equal quantity (or be empty / partial — extra slots are left unfilled).
export async function POST(request: NextRequest) {
    if (!(await isAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    try {
        const body = await request.json()
        const { name, description, price, quantity, credentials } = body as {
            name: string
            description?: string
            price: number
            quantity: number
            credentials?: string[]
        }

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return NextResponse.json({ error: 'Product name is required' }, { status: 400 })
        }
        if (typeof price !== 'number' || price < 0) {
            return NextResponse.json({ error: 'Valid price is required' }, { status: 400 })
        }
        const qty = Math.max(0, Math.floor(Number(quantity) || 0))

        const sql = getDb()

        // Insert product
        const [product] = await sql`
      INSERT INTO products (name, description, price, available_qty)
      VALUES (
        ${name.trim()},
        ${description?.trim() ?? null},
        ${price},
        ${qty}
      )
      RETURNING id, name, description, price, available_qty, created_at
    `

        // Insert credentials into buyer_credentials_inventory
        const credRows = Array.isArray(credentials)
            ? credentials.filter((c) => typeof c === 'string' && c.trim().length > 0)
            : []

        let insertedCredentials = 0
        for (const cred of credRows) {
            await sql`
        INSERT INTO buyer_credentials_inventory (product_id, credential_data)
        VALUES (${product.id}, ${cred.trim()})
      `
            insertedCredentials++
        }

        return NextResponse.json(
            {
                product,
                insertedCredentials,
                message: `Product created with ${insertedCredentials} credential(s) added to inventory.`,
            },
            { status: 201 }
        )
    } catch (error) {
        console.error('[Admin/Products] POST error:', error)
        return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
    }
}
