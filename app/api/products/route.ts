import { NextRequest, NextResponse } from 'next/server'
import { ensureCredentialsInventoryTables } from '@/lib/credentials-inventory'
import { getDb } from '@/lib/db'

/**
 * GET /api/products
 * Fetches all available products for the public storefront
 */
export async function GET(request: NextRequest) {
  try {
    const sql = getDb()
    await ensureCredentialsInventoryTables()

    const products = await sql`
      WITH inventory AS (
        SELECT
          p.id,
          p.sku,
          p.name,
          p.description,
          p.price,
          p.badge,
          p.is_featured,
          p.images,
          p.product_username,
          p.product_password,
          p.category_id,
          p.created_at,
          COUNT(bci.id) FILTER (WHERE bci.assigned_to_buyer_id IS NULL) AS unassigned_inventory,
          COUNT(bci.id) AS total_inventory_rows
        FROM products p
        LEFT JOIN buyer_credentials_inventory bci ON bci.product_id = p.id
        GROUP BY
          p.id,
          p.sku,
          p.name,
          p.description,
          p.price,
          p.badge,
          p.is_featured,
          p.images,
          p.product_username,
          p.product_password,
          p.category_id,
          p.created_at
      )
      SELECT
        inventory.id,
        inventory.sku,
        inventory.name,
        inventory.description,
        inventory.price,
        (
          CASE
            WHEN inventory.total_inventory_rows = 0
              AND (
                COALESCE(NULLIF(BTRIM(inventory.product_username), ''), NULL) IS NOT NULL
                OR COALESCE(NULLIF(BTRIM(inventory.product_password), ''), NULL) IS NOT NULL
              )
              THEN 1
            ELSE inventory.unassigned_inventory
          END
        ) AS available_qty,
        inventory.badge,
        inventory.is_featured,
        inventory.images,
        CASE
          WHEN inventory.total_inventory_rows > 0 THEN inventory.unassigned_inventory > 0
          WHEN COALESCE(NULLIF(BTRIM(inventory.product_username), ''), NULL) IS NOT NULL
            OR COALESCE(NULLIF(BTRIM(inventory.product_password), ''), NULL) IS NOT NULL
            THEN true
          ELSE false
        END AS has_credentials,
        COALESCE(c.name, 'Uncategorized') AS category_name,
        inventory.created_at
      FROM inventory
      LEFT JOIN categories c ON inventory.category_id = c.id
      WHERE (
        CASE
          WHEN inventory.total_inventory_rows = 0
            AND (
              COALESCE(NULLIF(BTRIM(inventory.product_username), ''), NULL) IS NOT NULL
              OR COALESCE(NULLIF(BTRIM(inventory.product_password), ''), NULL) IS NOT NULL
            )
            THEN 1
          ELSE inventory.unassigned_inventory
        END
      ) > 0
      ORDER BY inventory.is_featured DESC, inventory.created_at DESC
    `

    return NextResponse.json(products, { status: 200 })
  } catch (error) {
    console.error('[Products] Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products', message: String(error) },
      { status: 500 }
    )
  }
}
