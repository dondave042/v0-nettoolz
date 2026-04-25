const { neon } = require("@neondatabase/serverless")

const sql = neon(process.env.DATABASE_URL)

async function fixOrdersSchema() {
  try {
    console.log("[Migration] Starting order schema fix...")

    // Ensure buyers table exists
    await sql`
      CREATE TABLE IF NOT EXISTS buyers (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        balance DECIMAL(10, 2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `
    console.log("[Migration] Ensured buyers table exists")

    // Ensure payment_methods table exists
    await sql`
      CREATE TABLE IF NOT EXISTS payment_methods (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(50),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `
    console.log("[Migration] Ensured payment_methods table exists")

    // Drop and recreate orders table with correct schema
    await sql`
      DROP TABLE IF EXISTS order_credentials CASCADE
    `
    await sql`
      DROP TABLE IF EXISTS orders CASCADE
    `
    console.log("[Migration] Dropped old tables")

    // Create correct orders table
    await sql`
      CREATE TABLE orders (
        id SERIAL PRIMARY KEY,
        buyer_id INT NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
        product_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        total_price DECIMAL(10, 2) NOT NULL,
        payment_method_id INT,
        status VARCHAR(50) DEFAULT 'pending',
        payment_status VARCHAR(50) DEFAULT 'pending',
        payment_reference_id VARCHAR(255) UNIQUE,
        buyer_email VARCHAR(255),
        payment_completed_at TIMESTAMP,
        payment_failed_at TIMESTAMP,
        payment_cancelled_at TIMESTAMP,
        payment_amount DECIMAL(10, 2),
        payment_currency VARCHAR(10),
        payment_error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `
    console.log("[Migration] Created correct orders table")

    // Create order_credentials table
    await sql`
      CREATE TABLE IF NOT EXISTS order_credentials (
        id SERIAL PRIMARY KEY,
        order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        credential_id INT NOT NULL REFERENCES buyer_credentials_inventory(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(order_id, credential_id)
      )
    `
    console.log("[Migration] Created order_credentials table")

    // Ensure buyer_credentials_inventory table has correct schema
    await sql`
      CREATE TABLE IF NOT EXISTS buyer_credentials_inventory (
        id SERIAL PRIMARY KEY,
        product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        credential_data TEXT,
        assigned_to_buyer_id INT REFERENCES buyers(id) ON DELETE SET NULL,
        assigned_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `
    console.log("[Migration] Ensured buyer_credentials_inventory table exists")

    // Ensure payment_webhooks table exists
    await sql`
      CREATE TABLE IF NOT EXISTS payment_webhooks (
        id SERIAL PRIMARY KEY,
        reference_id VARCHAR(255) NOT NULL UNIQUE,
        order_id INT REFERENCES orders(id) ON DELETE SET NULL,
        event_type VARCHAR(100),
        payload JSONB,
        status VARCHAR(50) DEFAULT 'processing',
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `
    console.log("[Migration] Ensured payment_webhooks table exists")

    // Ensure deposits table exists
    await sql`
      CREATE TABLE IF NOT EXISTS deposits (
        id SERIAL PRIMARY KEY,
        buyer_id INT NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
        amount DECIMAL(10, 2) NOT NULL,
        reference_id VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `
    console.log("[Migration] Ensured deposits table exists")

    // Insert default payment methods if they don't exist
    const existingMethods = await sql`
      SELECT COUNT(*) as count FROM payment_methods WHERE name IN ('Dashboard Balance', 'Korapay')
    `
    
    if (existingMethods[0]?.count === 0) {
      await sql`
        INSERT INTO payment_methods (name, type, is_active) VALUES
          ('Dashboard Balance', 'balance', TRUE),
          ('Korapay', 'external', TRUE)
      `
      console.log("[Migration] Inserted default payment methods")
    } else {
      console.log("[Migration] Default payment methods already exist")
    }

    console.log("[Migration] ✅ Database schema fixed successfully!")
  } catch (error) {
    console.error("[Migration] ❌ Error fixing schema:", error)
    process.exit(1)
  }
}

fixOrdersSchema()
