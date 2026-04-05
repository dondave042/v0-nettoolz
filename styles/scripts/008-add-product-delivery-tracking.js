import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL)

async function runMigration() {
  try {
    console.log("[Migration] Starting product delivery tracking setup...")

    // Add delivery tracking columns to orders table
    await sql`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS is_delivered BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS delivery_notes TEXT
    `
    console.log("[Migration] Added delivery tracking columns to orders table")

    // Create product_deliveries table for detailed delivery history
    await sql`
      CREATE TABLE IF NOT EXISTS product_deliveries (
        id SERIAL PRIMARY KEY,
        order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        buyer_id INT NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
        product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        quantity INT NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        delivery_method VARCHAR(50) DEFAULT 'instant',
        credentials JSONB DEFAULT '{}',
        is_delivered BOOLEAN DEFAULT false,
        delivered_at TIMESTAMP,
        delivery_notes TEXT,
        admin_id INT REFERENCES admin_users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `
    console.log("[Migration] Created product_deliveries table")

    // Create index for fast lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_product_deliveries_buyer_id
      ON product_deliveries(buyer_id)
    `
    console.log("[Migration] Created index on product_deliveries buyer_id")

    await sql`
      CREATE INDEX IF NOT EXISTS idx_product_deliveries_order_id
      ON product_deliveries(order_id)
    `
    console.log("[Migration] Created index on product_deliveries order_id")

    await sql`
      CREATE INDEX IF NOT EXISTS idx_product_deliveries_is_delivered
      ON product_deliveries(is_delivered)
    `
    console.log("[Migration] Created index on product_deliveries is_delivered")

    // Create view for pending deliveries (completed payments not yet delivered)
    await sql`
      CREATE OR REPLACE VIEW pending_deliveries AS
      SELECT
        o.id as order_id,
        o.buyer_id,
        o.product_id,
        o.total_price,
        o.payment_status,
        o.payment_confirmed_at,
        b.email as buyer_email,
        b.full_name as buyer_name,
        p.name as product_name,
        p.sku as product_sku,
        o.quantity,
        o.created_at as order_date,
        COUNT(pd.id) as delivery_count
      FROM orders o
      JOIN buyers b ON o.buyer_id = b.id
      JOIN products p ON o.product_id = p.id
      LEFT JOIN product_deliveries pd ON o.id = pd.order_id AND pd.is_delivered = true
      WHERE o.payment_status = 'completed' AND o.is_delivered = false
      GROUP BY o.id, b.id, p.id
      ORDER BY o.payment_confirmed_at DESC
    `
    console.log("[Migration] Created pending_deliveries view")

    console.log("[Migration] Successfully completed product delivery tracking setup!")
  } catch (error) {
    console.error("[Migration] Error:", error)
    throw error
  }
}

runMigration()
