-- Add unique constraint to categories.name for ON CONFLICT (name)
ALTER TABLE categories ADD CONSTRAINT categories_name_unique UNIQUE (name);
