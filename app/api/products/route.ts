import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

/**
 * GET /api/products
 * Fetches all available products with inventory count
 * Includes pricing, availability, and basic product info
 */
export async function GET(request: NextRequest) {
  try {
    const sql = getDb()

    // Get all active products with inventory
    const products = await sql`
      SELECT
        p.id,
        p.name,
        p.description,
        p.price,
        p.available_qty,
        COUNT(CASE WHEN bci.assigned_to_buyer_id IS NULL THEN 1 END) as available_credentials,
        p.created_at
      FROM products p
      LEFT JOIN buyer_credentials_inventory bci ON p.id = bci.product_id
      WHERE p.available_qty > 0
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `

    return NextResponse.json({
      products: products.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: parseFloat(product.price),
        available_qty: product.available_qty,
        available_credentials: Number(product.available_credentials),
        in_stock: product.available_qty > 0,
        created_at: product.created_at,
      })),
      total: products.length,
    }, { status: 200 })
  } catch (error) {
    console.error('[Products] Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products', message: String(error) },
      { status: 500 }
    )
  }
}
