-- Fix orders table schema and add payment/credential tables for Korapay integration

-- Create buyers table if it doesn't exist (replaces users for buyer management)
CREATE TABLE IF NOT EXISTS buyers (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  balance DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recreate orders table with proper schema for e-commerce with payments
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;

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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Create payment methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create products table with updated schema if needed
DROP TABLE IF EXISTS products CASCADE;
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  available_qty INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create buyer credentials inventory for digital goods delivery
CREATE TABLE IF NOT EXISTS buyer_credentials_inventory (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  credential_data TEXT,
  assigned_to_buyer_id INT REFERENCES buyers(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, id)
);

-- Link credentials to orders
CREATE TABLE IF NOT EXISTS order_credentials (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  credential_id INT NOT NULL REFERENCES buyer_credentials_inventory(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(order_id, credential_id)
);

-- Payment webhooks log for Korapay
CREATE TABLE IF NOT EXISTS payment_webhooks (
  id SERIAL PRIMARY KEY,
  reference_id VARCHAR(255) NOT NULL UNIQUE,
  order_id INT REFERENCES orders(id) ON DELETE SET NULL,
  event_type VARCHAR(100),
  payload JSONB,
  status VARCHAR(50) DEFAULT 'processing',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Deposits table for balance top-ups
CREATE TABLE IF NOT EXISTS deposits (
  id SERIAL PRIMARY KEY,
  buyer_id INT NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  reference_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default payment methods if they don't exist
INSERT INTO payment_methods (name, type, is_active) VALUES
  ('Dashboard Balance', 'balance', TRUE),
  ('Korapay', 'external', TRUE)
ON CONFLICT DO NOTHING;
