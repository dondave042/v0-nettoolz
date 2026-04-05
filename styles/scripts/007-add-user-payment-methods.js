import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL)

async function runMigration() {
  try {
    console.log("[Migration] Starting user payment methods setup...")

    // Create user_payment_methods table to store buyer's saved payment methods
    await sql`
      CREATE TABLE IF NOT EXISTS user_payment_methods (
        id SERIAL PRIMARY KEY,
        buyer_id INT NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
        payment_method_type VARCHAR(50) NOT NULL,
        display_name VARCHAR(255) NOT NULL,
        account_identifier VARCHAR(255),
        is_default BOOLEAN DEFAULT false,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(buyer_id, display_name)
      )
    `
    console.log("[Migration] Created user_payment_methods table")

    // Create index for fast lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_user_payment_methods_buyer_id
      ON user_payment_methods(buyer_id)
    `
    console.log("[Migration] Created index on user_payment_methods buyer_id")

    // Add payment_method_id to orders table to track which user payment method was used
    await sql`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS user_payment_method_id INT REFERENCES user_payment_methods(id) ON DELETE SET NULL
    `
    console.log("[Migration] Added user_payment_method_id to orders table")

    // Create payment_history view for easy retrieval
    await sql`
      CREATE OR REPLACE VIEW payment_history AS
      SELECT
        o.id as order_id,
        o.buyer_id,
        o.product_id,
        o.quantity,
        o.total_price,
        o.payment_status,
        o.payment_method_type,
        upm.display_name as payment_method_name,
        o.payment_confirmed_at,
        o.created_at,
        p.name as product_name
      FROM orders o
      LEFT JOIN user_payment_methods upm ON o.user_payment_method_id = upm.id
      LEFT JOIN products p ON o.product_id = p.id
      WHERE o.buyer_id IS NOT NULL
      ORDER BY o.created_at DESC
    `
    console.log("[Migration] Created payment_history view")

    console.log("[Migration] Successfully completed user payment methods setup!")
  } catch (error) {
    console.error("[Migration] Error:", error)
    throw error
  }
}

runMigration()
