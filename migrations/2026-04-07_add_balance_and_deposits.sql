-- Add balance field to buyers table
ALTER TABLE buyers ADD COLUMN balance DECIMAL(10, 2) DEFAULT 0.00;

-- Create deposits table for tracking balance additions
CREATE TABLE deposits (
  id SERIAL PRIMARY KEY,
  buyer_id INT REFERENCES buyers(id),
  amount DECIMAL(10, 2) NOT NULL,
  payment_method_id INT REFERENCES payment_methods(id),
  reference_id VARCHAR(255) UNIQUE,
  status VARCHAR(50) DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create index for better performance
CREATE INDEX idx_deposits_buyer_id ON deposits(buyer_id);
CREATE INDEX idx_deposits_reference_id ON deposits(reference_id);