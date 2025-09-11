-- Add missing total_price column to order_items table
-- This fixes the order placement error

-- Add the total_price column if it doesn't exist
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS total_price DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Update existing records to populate total_price based on unit_price * quantity
UPDATE order_items 
SET total_price = unit_price * quantity 
WHERE total_price = 0 OR total_price IS NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'order_items' 
AND table_schema = 'public'
ORDER BY ordinal_position;
