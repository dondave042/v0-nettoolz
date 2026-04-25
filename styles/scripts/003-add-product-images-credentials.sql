-- Add product images and credentials support
-- This migration adds image storage and product credentials

-- Add new columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_username TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_password TEXT;

-- Create product_purchases table to track which customers bought which products
-- This is used to verify if a customer can view product credentials
CREATE TABLE IF NOT EXISTS product_purchases (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_email VARCHAR(255) NOT NULL,
  purchased_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, customer_email)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_product_purchases_product_email 
ON product_purchases(product_id, customer_email);
