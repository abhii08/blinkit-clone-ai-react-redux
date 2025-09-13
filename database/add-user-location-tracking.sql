-- =====================================================
-- ADD USER LOCATION TRACKING COLUMNS
-- =====================================================
-- This script adds columns to track user's current location
-- for delivery agent tracking functionality
-- =====================================================

-- Add user location tracking columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_current_latitude DECIMAL(10,8);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_current_longitude DECIMAL(11,8);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_location_updated_at TIMESTAMP WITH TIME ZONE;

-- Create index for location queries
CREATE INDEX IF NOT EXISTS idx_orders_user_location ON orders(user_current_latitude, user_current_longitude);

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('user_current_latitude', 'user_current_longitude', 'user_location_updated_at');
