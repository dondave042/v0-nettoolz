import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL)

async function runMigration() {
  try {
    console.log("[Migration] Starting payment tracking enhancement...")

    // Add payment tracking columns to orders table
    await sql`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS payment_reference_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS payment_method_type VARCHAR(50),
      ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS payment_failure_reason TEXT,
      ADD COLUMN IF NOT EXISTS assigned_to_buyer_id INT REFERENCES buyers(id) ON DELETE SET NULL
    `
    console.log("[Migration] Updated orders table with payment tracking columns")

    // Create unique index on payment_reference_id for webhook deduplication
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_reference_id 
      ON orders(payment_reference_id) 
      WHERE payment_reference_id IS NOT NULL
    `
    console.log("[Migration] Created unique index on payment_reference_id")

    // Create payment_webhooks table for audit trail
    await sql`
      CREATE TABLE IF NOT EXISTS payment_webhooks (
        id SERIAL PRIMARY KEY,
        order_id INT REFERENCES orders(id) ON DELETE CASCADE,
        reference_id VARCHAR(255) NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        payload JSONB NOT NULL,
        processed BOOLEAN DEFAULT false,
        processed_at TIMESTAMP,
        error_message TEXT,
        retry_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `
    console.log("[Migration] Created payment_webhooks table")

    // Create index on reference_id for fast webhook lookup
    await sql`
      CREATE INDEX IF NOT EXISTS idx_payment_webhooks_reference_id 
      ON payment_webhooks(reference_id)
    `
    console.log("[Migration] Created index on payment_webhooks reference_id")

    // Create index on order_id for fast order lookup
    await sql`
      CREATE INDEX IF NOT EXISTS idx_payment_webhooks_order_id 
      ON payment_webhooks(order_id)
    `
    console.log("[Migration] Created index on payment_webhooks order_id")

    // Create index on event_type for filtering
    await sql`
      CREATE INDEX IF NOT EXISTS idx_payment_webhooks_event_type 
      ON payment_webhooks(event_type)
    `
    console.log("[Migration] Created index on payment_webhooks event_type")

    console.log("[Migration] Successfully completed payment tracking enhancement!")
  } catch (error) {
    console.error("[Migration] Error:", error)
    throw error
  }
}

runMigration()
