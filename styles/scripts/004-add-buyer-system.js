import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL)

async function runMigration() {
  try {
    console.log("[Migration] Starting buyer system setup...")

    // Create buyers table
    await sql`
      CREATE TABLE IF NOT EXISTS buyers (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `
    console.log("[Migration] Created buyers table")

    // Create buyer_credentials_inventory table
    await sql`
      CREATE TABLE IF NOT EXISTS buyer_credentials_inventory (
        id SERIAL PRIMARY KEY,
        product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        credentials_index INT NOT NULL,
        is_distributed BOOLEAN DEFAULT false,
        distributed_to_buyer_id INT REFERENCES buyers(id) ON DELETE SET NULL,
        distributed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(product_id, credentials_index)
      )
    `
    console.log("[Migration] Created buyer_credentials_inventory table")

    // Add columns to orders table if they don't exist
    await sql`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS buyer_id INT REFERENCES buyers(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS checkout_method VARCHAR(50),
      ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255)
    `
    console.log("[Migration] Updated orders table")

    // Create payment_methods table for admin checkout configuration
    await sql`
      CREATE TABLE IF NOT EXISTS payment_methods (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        config JSONB,
        is_active BOOLEAN DEFAULT true,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `
    console.log("[Migration] Created payment_methods table")

    console.log("[Migration] Successfully completed buyer system setup!")
  } catch (error) {
    console.error("[Migration] Error:", error)
    throw error
  }
}

runMigration()
