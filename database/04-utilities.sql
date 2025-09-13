-- =====================================================
-- BLINKIT CLONE - DATABASE UTILITIES
-- =====================================================
-- Utility functions and procedures for database management
-- These are helper functions for development and maintenance
-- =====================================================

-- =====================================================
-- DEVELOPMENT UTILITIES
-- =====================================================

-- Function to reset all delivery agent statuses (useful for development)
CREATE OR REPLACE FUNCTION reset_agent_statuses()
RETURNS INTEGER AS $$
DECLARE
    affected_count INTEGER;
BEGIN
    UPDATE delivery_agents 
    SET status = 'offline', 
        last_active_at = NOW(),
        updated_at = NOW()
    WHERE status != 'offline';
    
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    RETURN affected_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clear all cart items (useful for testing)
CREATE OR REPLACE FUNCTION clear_all_carts()
RETURNS INTEGER AS $$
DECLARE
    affected_count INTEGER;
BEGIN
    DELETE FROM cart_items;
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    RETURN affected_count;
END;
$$ LANGUAGE plpgsql;

-- Function to generate sample orders for testing
CREATE OR REPLACE FUNCTION generate_sample_orders(
    user_count INTEGER DEFAULT 5,
    orders_per_user INTEGER DEFAULT 3
)
RETURNS INTEGER AS $$
DECLARE
    sample_user_id UUID;
    sample_store_id UUID;
    sample_product_id UUID;
    order_id UUID;
    total_orders INTEGER := 0;
    i INTEGER;
    j INTEGER;
BEGIN
    -- Get sample store
    SELECT id INTO sample_store_id FROM stores LIMIT 1;
    
    -- Create sample orders for existing users
    FOR sample_user_id IN (
        SELECT id FROM auth.users LIMIT user_count
    ) LOOP
        FOR i IN 1..orders_per_user LOOP
            -- Create order
            INSERT INTO orders (
                user_id, 
                store_id, 
                status, 
                items_total, 
                delivery_charge, 
                handling_charge, 
                total_amount,
                delivery_address
            ) VALUES (
                sample_user_id,
                sample_store_id,
                CASE (RANDOM() * 5)::INTEGER
                    WHEN 0 THEN 'pending'
                    WHEN 1 THEN 'confirmed'
                    WHEN 2 THEN 'preparing'
                    WHEN 3 THEN 'out_for_delivery'
                    ELSE 'delivered'
                END,
                (RANDOM() * 500 + 100)::DECIMAL(10,2),
                CASE WHEN RANDOM() > 0.5 THEN 0 ELSE 25 END,
                5.00,
                (RANDOM() * 500 + 130)::DECIMAL(10,2),
                'Sample Address, City, State 123456'
            ) RETURNING id INTO order_id;
            
            -- Add sample order items
            FOR j IN 1..(RANDOM() * 3 + 1)::INTEGER LOOP
                SELECT id INTO sample_product_id FROM products ORDER BY RANDOM() LIMIT 1;
                
                INSERT INTO order_items (
                    order_id,
                    product_id,
                    quantity,
                    unit_price,
                    total,
                    total_price,
                    product_name,
                    product_unit
                ) SELECT 
                    order_id,
                    p.id,
                    (RANDOM() * 3 + 1)::INTEGER,
                    p.price,
                    p.price * (RANDOM() * 3 + 1)::INTEGER,
                    p.price * (RANDOM() * 3 + 1)::INTEGER,
                    p.name,
                    p.unit
                FROM products p WHERE p.id = sample_product_id;
            END LOOP;
            
            total_orders := total_orders + 1;
        END LOOP;
    END LOOP;
    
    RETURN total_orders;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- MAINTENANCE UTILITIES
-- =====================================================

-- Function to update inventory based on recent orders
CREATE OR REPLACE FUNCTION update_inventory_from_orders()
RETURNS INTEGER AS $$
DECLARE
    affected_count INTEGER := 0;
    order_item RECORD;
BEGIN
    -- Reduce inventory for delivered orders in the last hour
    FOR order_item IN (
        SELECT oi.product_id, oi.quantity, o.store_id
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status = 'delivered' 
        AND o.delivered_at > NOW() - INTERVAL '1 hour'
    ) LOOP
        UPDATE inventory 
        SET quantity = GREATEST(0, quantity - order_item.quantity),
            updated_at = NOW()
        WHERE product_id = order_item.product_id 
        AND store_id = order_item.store_id;
        
        affected_count := affected_count + 1;
    END LOOP;
    
    RETURN affected_count;
END;
$$ LANGUAGE plpgsql;

-- Function to restock low inventory items
CREATE OR REPLACE FUNCTION restock_low_inventory()
RETURNS INTEGER AS $$
DECLARE
    affected_count INTEGER;
BEGIN
    UPDATE inventory 
    SET quantity = quantity + (reorder_level * 2),
        last_restocked_at = NOW(),
        updated_at = NOW()
    WHERE quantity <= reorder_level;
    
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    RETURN affected_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ANALYTICS UTILITIES
-- =====================================================

-- Function to get delivery performance stats
CREATE OR REPLACE FUNCTION get_delivery_performance_stats()
RETURNS TABLE (
    total_orders BIGINT,
    delivered_orders BIGINT,
    avg_delivery_time_minutes NUMERIC,
    success_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_orders,
        COUNT(*) FILTER (WHERE status = 'delivered') as delivered_orders,
        AVG(EXTRACT(EPOCH FROM (delivered_at - created_at))/60) FILTER (WHERE status = 'delivered') as avg_delivery_time_minutes,
        (COUNT(*) FILTER (WHERE status = 'delivered')::NUMERIC / NULLIF(COUNT(*), 0) * 100) as success_rate
    FROM orders
    WHERE created_at > NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Function to get top selling products
CREATE OR REPLACE FUNCTION get_top_selling_products(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    product_id UUID,
    product_name VARCHAR,
    total_quantity BIGINT,
    total_revenue NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.total) as total_revenue
    FROM products p
    JOIN order_items oi ON p.id = oi.product_id
    JOIN orders o ON oi.order_id = o.id
    WHERE o.status = 'delivered'
    AND o.created_at > NOW() - INTERVAL '30 days'
    GROUP BY p.id, p.name
    ORDER BY total_quantity DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get agent performance summary
CREATE OR REPLACE FUNCTION get_agent_performance_summary()
RETURNS TABLE (
    agent_id UUID,
    agent_name VARCHAR,
    total_deliveries BIGINT,
    avg_rating NUMERIC,
    total_earnings NUMERIC,
    avg_delivery_time_minutes NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        da.id,
        da.full_name,
        COUNT(o.id) as total_deliveries,
        AVG(ae.customer_rating::NUMERIC) as avg_rating,
        SUM(ae.total_earning) as total_earnings,
        AVG(ae.delivery_time_minutes::NUMERIC) as avg_delivery_time_minutes
    FROM delivery_agents da
    LEFT JOIN orders o ON da.id = o.delivery_agent_id AND o.status = 'delivered'
    LEFT JOIN agent_earnings ae ON da.id = ae.agent_id
    WHERE da.is_active = true
    GROUP BY da.id, da.full_name
    ORDER BY total_deliveries DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DATA CLEANUP UTILITIES
-- =====================================================

-- Function to clean up old notifications
CREATE OR REPLACE FUNCTION cleanup_old_notifications(days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    affected_count INTEGER;
BEGIN
    -- Clean up user notifications
    DELETE FROM notifications 
    WHERE created_at < NOW() - (days_old || ' days')::INTERVAL
    AND is_read = true;
    
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    
    -- Clean up agent notifications
    DELETE FROM agent_notifications 
    WHERE created_at < NOW() - (days_old || ' days')::INTERVAL
    AND is_read = true;
    
    GET DIAGNOSTICS affected_count = affected_count + ROW_COUNT;
    
    RETURN affected_count;
END;
$$ LANGUAGE plpgsql;

-- Function to archive old orders
CREATE OR REPLACE FUNCTION archive_old_orders(days_old INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    affected_count INTEGER;
BEGIN
    -- This would typically move data to an archive table
    -- For now, we'll just mark them as archived in metadata
    UPDATE orders 
    SET notes = COALESCE(notes, '') || ' [ARCHIVED]'
    WHERE created_at < NOW() - (days_old || ' days')::INTERVAL
    AND status IN ('delivered', 'cancelled')
    AND (notes IS NULL OR notes NOT LIKE '%[ARCHIVED]%');
    
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    RETURN affected_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- HEALTH CHECK UTILITIES
-- =====================================================

-- Function to check database health
CREATE OR REPLACE FUNCTION check_database_health()
RETURNS TABLE (
    check_name TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check for orphaned records
    RETURN QUERY
    SELECT 
        'Orphaned Cart Items'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'WARNING' END::TEXT,
        'Found ' || COUNT(*) || ' cart items without valid products'::TEXT
    FROM cart_items ci
    LEFT JOIN products p ON ci.product_id = p.id
    WHERE p.id IS NULL;
    
    -- Check for invalid inventory
    RETURN QUERY
    SELECT 
        'Invalid Inventory'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'ERROR' END::TEXT,
        'Found ' || COUNT(*) || ' inventory records with negative quantities'::TEXT
    FROM inventory
    WHERE quantity < 0 OR reserved_quantity < 0 OR reserved_quantity > quantity;
    
    -- Check for agents without location
    RETURN QUERY
    SELECT 
        'Agents Without Location'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'WARNING' END::TEXT,
        'Found ' || COUNT(*) || ' active agents without location data'::TEXT
    FROM delivery_agents
    WHERE is_active = true AND (latitude IS NULL OR longitude IS NULL);
    
    -- Check for orders without items
    RETURN QUERY
    SELECT 
        'Orders Without Items'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'ERROR' END::TEXT,
        'Found ' || COUNT(*) || ' orders without any items'::TEXT
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE oi.order_id IS NULL;
END;
$$ LANGUAGE plpgsql;
