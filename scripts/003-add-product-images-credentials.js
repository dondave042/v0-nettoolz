import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  console.log("Starting migration: Adding product images and credentials...");

  try {
    // Add new columns to products table
    console.log("Adding columns to products table...");
    await sql`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS product_username VARCHAR(255),
      ADD COLUMN IF NOT EXISTS product_password VARCHAR(255)
    `;
    console.log("✓ Added product images and credentials columns");

    // Create product_purchases table to track which buyers have access to credentials
    console.log("Creating product_purchases table...");
    await sql`
      CREATE TABLE IF NOT EXISTS product_purchases (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, product_id),
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `;
    console.log("✓ Created product_purchases table");

    // Create index for faster lookups
    console.log("Creating index for product_purchases...");
    await sql`
      CREATE INDEX IF NOT EXISTS idx_product_purchases_user_product 
      ON product_purchases(user_id, product_id)
    `;
    console.log("✓ Created index for product_purchases");

    console.log("\n✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  }
}

migrate();
