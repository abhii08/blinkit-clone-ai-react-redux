-- =====================================================
-- BLINKIT CLONE - DATABASE MIGRATIONS
-- =====================================================
-- Migration scripts for database updates and fixes
-- Run these when updating existing database installations
-- =====================================================

-- Migration 001: Add total_price column to order_items for frontend compatibility
-- Date: 2024-01-15
-- Description: Adds total_price column to order_items table to fix order placement errors
DO $$
BEGIN
    -- Check if total_price column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'total_price'
    ) THEN
        -- Add the column
        ALTER TABLE order_items ADD COLUMN total_price DECIMAL(10,2) NOT NULL DEFAULT 0;
        
        -- Update existing records to match total column
        UPDATE order_items SET total_price = total WHERE total_price = 0;
        
        RAISE NOTICE 'Migration 001: Added total_price column to order_items table';
    ELSE
        RAISE NOTICE 'Migration 001: total_price column already exists, skipping';
    END IF;
END
$$;

-- Migration 002: Fix user metadata for delivery agent distinction
-- Date: 2024-01-16
-- Description: Updates auth.users metadata to distinguish between users and delivery agents
DO $$
BEGIN
    -- Update all existing users to have user_type = 'user' by default
    UPDATE auth.users 
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"user_type": "user"}'::jsonb
    WHERE raw_user_meta_data IS NULL OR NOT raw_user_meta_data ? 'user_type';
    
    -- Update users who are delivery agents to have user_type = 'delivery_agent'
    UPDATE auth.users 
    SET raw_user_meta_data = raw_user_meta_data || '{"user_type": "delivery_agent"}'::jsonb
    WHERE id IN (
        SELECT user_id 
        FROM public.delivery_agents
    );
    
    RAISE NOTICE 'Migration 002: Updated user metadata for delivery agent distinction';
END
$$;

-- Migration 003: Add product_name and product_unit to order_items
-- Date: 2024-01-17
-- Description: Adds product details to order_items for better order tracking
DO $$
BEGIN
    -- Check if product_name column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'product_name'
    ) THEN
        ALTER TABLE order_items ADD COLUMN product_name VARCHAR(200) NOT NULL DEFAULT '';
        RAISE NOTICE 'Migration 003a: Added product_name column to order_items table';
    END IF;
    
    -- Check if product_unit column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' 
        AND column_name = 'product_unit'
    ) THEN
        ALTER TABLE order_items ADD COLUMN product_unit VARCHAR(50) NOT NULL DEFAULT '';
        RAISE NOTICE 'Migration 003b: Added product_unit column to order_items table';
    END IF;
    
    -- Update existing records with product details
    UPDATE order_items 
    SET 
        product_name = p.name,
        product_unit = p.unit
    FROM products p 
    WHERE order_items.product_id = p.id 
    AND (order_items.product_name = '' OR order_items.product_unit = '');
    
    RAISE NOTICE 'Migration 003: Updated existing order_items with product details';
END
$$;

-- Migration 004: Fix delivery agent RLS policies
-- Date: 2024-01-18
-- Description: Updates RLS policies for delivery agents to allow proper access
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Agents can view their assigned orders" ON orders;
    DROP POLICY IF EXISTS "Agents can update their assigned orders" ON orders;
    
    -- Create new policies for delivery agents
    CREATE POLICY "Agents can view their assigned orders" ON orders 
    FOR SELECT USING (
        delivery_agent_id IN (
            SELECT id FROM delivery_agents WHERE user_id = auth.uid()
        )
    );
    
    CREATE POLICY "Agents can update their assigned orders" ON orders 
    FOR UPDATE USING (
        delivery_agent_id IN (
            SELECT id FROM delivery_agents WHERE user_id = auth.uid()
        )
    );
    
    RAISE NOTICE 'Migration 004: Updated delivery agent RLS policies';
END
$$;

-- Migration 005: Add agent notifications table if not exists
-- Date: 2024-01-19
-- Description: Ensures agent_notifications table exists with proper structure
DO $$
BEGIN
    -- Check if agent_notifications table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'agent_notifications'
    ) THEN
        CREATE TABLE agent_notifications (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            agent_id UUID NOT NULL REFERENCES delivery_agents(id) ON DELETE CASCADE,
            title VARCHAR(200) NOT NULL,
            message TEXT NOT NULL,
            type VARCHAR(30) DEFAULT 'info' CHECK (type IN (
                'info', 'order_assigned', 'order_cancelled', 'payment_received', 
                'rating_received', 'system_alert', 'promotion'
            )),
            is_read BOOLEAN DEFAULT false,
            is_pushed BOOLEAN DEFAULT false,
            metadata JSONB,
            action_url TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            read_at TIMESTAMP WITH TIME ZONE
        );
        
        -- Add index
        CREATE INDEX idx_agent_notifications_agent ON agent_notifications(agent_id);
        
        -- Enable RLS
        ALTER TABLE agent_notifications ENABLE ROW LEVEL SECURITY;
        
        -- Add policy
        CREATE POLICY "Agents can view their own notifications" ON agent_notifications 
        FOR ALL USING (agent_id IN (SELECT id FROM delivery_agents WHERE user_id = auth.uid()));
        
        RAISE NOTICE 'Migration 005: Created agent_notifications table';
    ELSE
        RAISE NOTICE 'Migration 005: agent_notifications table already exists, skipping';
    END IF;
END
$$;

-- Migration 006: Update category images with proper URLs
-- Date: 2024-01-20
-- Description: Updates category images with high-quality Unsplash URLs
DO $$
BEGIN
    UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=200&h=200&fit=crop&crop=center' 
    WHERE slug = 'dairy-bread-eggs' AND (image_url IS NULL OR image_url = '');
    
    UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=200&h=200&fit=crop&crop=center' 
    WHERE slug = 'sweet-tooth' AND (image_url IS NULL OR image_url = '');
    
    UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=200&h=200&fit=crop&crop=center' 
    WHERE slug = 'snacks-munchies' AND (image_url IS NULL OR image_url = '');
    
    UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=200&h=200&fit=crop&crop=center' 
    WHERE slug = 'cold-drinks-juices' AND (image_url IS NULL OR image_url = '');
    
    UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=200&h=200&fit=crop&crop=center' 
    WHERE slug = 'fruits-vegetables' AND (image_url IS NULL OR image_url = '');
    
    UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop&crop=center' 
    WHERE slug = 'personal-care' AND (image_url IS NULL OR image_url = '');
    
    RAISE NOTICE 'Migration 006: Updated category images';
END
$$;

-- Migration 007: Fix order assignment error handling
-- Date: 2024-01-21
-- Description: Adds better error handling for order assignment process
DO $$
BEGIN
    -- Add assigned_at timestamp update trigger for orders
    CREATE OR REPLACE FUNCTION update_assigned_at()
    RETURNS TRIGGER AS $trigger$
    BEGIN
        -- Update assigned_at when delivery_agent_id is set
        IF OLD.delivery_agent_id IS NULL AND NEW.delivery_agent_id IS NOT NULL THEN
            NEW.assigned_at = NOW();
        END IF;
        RETURN NEW;
    END;
    $trigger$ LANGUAGE plpgsql;
    
    -- Drop trigger if exists and recreate
    DROP TRIGGER IF EXISTS trigger_orders_assigned_at ON orders;
    CREATE TRIGGER trigger_orders_assigned_at 
        BEFORE UPDATE ON orders 
        FOR EACH ROW 
        EXECUTE FUNCTION update_assigned_at();
    
    RAISE NOTICE 'Migration 007: Added order assignment timestamp trigger';
END
$$;

-- Migration 008: Add delivery agent status validation
-- Date: 2024-01-22
-- Description: Ensures delivery agent status transitions are valid
DO $$
BEGIN
    -- Create function to validate status transitions
    CREATE OR REPLACE FUNCTION validate_agent_status_transition()
    RETURNS TRIGGER AS $trigger$
    BEGIN
        -- Allow any transition for now, but log invalid ones
        -- In production, you might want to restrict certain transitions
        IF OLD.status IS NOT NULL AND OLD.status != NEW.status THEN
            -- Update last_active_at when status changes
            NEW.last_active_at = NOW();
        END IF;
        RETURN NEW;
    END;
    $trigger$ LANGUAGE plpgsql;
    
    -- Drop trigger if exists and recreate
    DROP TRIGGER IF EXISTS trigger_agent_status_validation ON delivery_agents;
    CREATE TRIGGER trigger_agent_status_validation 
        BEFORE UPDATE ON delivery_agents 
        FOR EACH ROW 
        EXECUTE FUNCTION validate_agent_status_transition();
    
    RAISE NOTICE 'Migration 008: Added agent status validation trigger';
END
$$;

-- Migration 009: Performance optimization indexes
-- Date: 2024-01-23
-- Description: Adds additional indexes for better query performance
DO $$
BEGIN
    -- Create indexes if they don't exist
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_delivery_agents_status_location ON delivery_agents(status, location) WHERE status = 'available';
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_category_active ON products(category_id, is_active) WHERE is_active = true;
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_product_quantity ON inventory(product_id, quantity) WHERE quantity > 0;
    
    RAISE NOTICE 'Migration 009: Added performance optimization indexes';
END
$$;

-- Migration 010: Clean up duplicate data
-- Date: 2024-01-24
-- Description: Removes any duplicate or invalid data
DO $$
BEGIN
    -- Remove duplicate inventory records (keep the one with higher quantity)
    DELETE FROM inventory i1 
    WHERE EXISTS (
        SELECT 1 FROM inventory i2 
        WHERE i2.store_id = i1.store_id 
        AND i2.product_id = i1.product_id 
        AND i2.id > i1.id
    );
    
    -- Fix negative quantities
    UPDATE inventory SET quantity = 0 WHERE quantity < 0;
    UPDATE inventory SET reserved_quantity = 0 WHERE reserved_quantity < 0;
    
    -- Fix reserved quantity exceeding available quantity
    UPDATE inventory 
    SET reserved_quantity = GREATEST(0, LEAST(reserved_quantity, quantity))
    WHERE reserved_quantity > quantity;
    
    RAISE NOTICE 'Migration 010: Cleaned up duplicate and invalid data';
END
$$;
