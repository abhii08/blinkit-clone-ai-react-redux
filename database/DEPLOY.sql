-- =====================================================
-- BLINKIT CLONE - DEPLOYMENT SCRIPT
-- =====================================================
-- Complete deployment script for production setup
-- Run this script in the following order:
-- 1. Execute 01-schema.sql first
-- 2. Execute 02-seed-data.sql second  
-- 3. Execute 03-migrations.sql third
-- 4. Execute this DEPLOY.sql script last
-- =====================================================

-- Verify all essential tables exist
DO $$
BEGIN
    -- Check if all core tables exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') THEN
        RAISE EXCEPTION 'Categories table missing. Run 01-schema.sql first.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
        RAISE EXCEPTION 'Products table missing. Run 01-schema.sql first.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
        RAISE EXCEPTION 'Orders table missing. Run 01-schema.sql first.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'delivery_agents') THEN
        RAISE EXCEPTION 'Delivery_agents table missing. Run 01-schema.sql first.';
    END IF;
    
    RAISE NOTICE 'All core tables verified successfully.';
END
$$;

-- Final performance optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cart_items_user ON cart_items(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_addresses_user_default ON addresses(user_id, is_default);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Final verification
SELECT 
    'Database deployment completed successfully!' as status,
    COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Display summary of key tables
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('categories', 'products', 'orders', 'delivery_agents', 'users', 'cart_items')
ORDER BY table_name;
