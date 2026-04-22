import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

/**
 * GET /api/products
 * Fetches all available products for the public storefront
 */
export async function GET(request: NextRequest) {
  try {
    const sql = getDb()

    const products = await sql`
      SELECT p.id, p.sku, p.name, p.description, p.price, p.available_qty,
             p.badge, p.is_featured, p.images,
             CASE WHEN p.product_username IS NOT NULL OR p.product_password IS NOT NULL THEN true ELSE false END as has_credentials,
             COALESCE(c.name, 'Uncategorized') as category_name,
             p.created_at
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.available_qty > 0
      ORDER BY p.is_featured DESC, p.created_at DESC
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
