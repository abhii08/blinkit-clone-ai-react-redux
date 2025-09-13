-- =====================================================
-- FIX ORDER ASSIGNMENT RLS POLICIES
-- =====================================================
-- This script adds missing RLS policies to allow order updates
-- for delivery agent assignment functionality
-- =====================================================

-- Add missing UPDATE policy for users on their own orders
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'orders' 
        AND policyname = 'Users can update their own orders'
    ) THEN
        CREATE POLICY "Users can update their own orders" ON orders FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Add policy for agents to view orders assigned to them
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'orders' 
        AND policyname = 'Agents can view orders assigned to them'
    ) THEN
        CREATE POLICY "Agents can view orders assigned to them" ON orders FOR SELECT USING (delivery_agent_id IN (SELECT id FROM delivery_agents WHERE user_id = auth.uid()));
    END IF;
END $$;

-- Add policy for agents to update orders assigned to them
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'orders' 
        AND policyname = 'Agents can update orders assigned to them'
    ) THEN
        CREATE POLICY "Agents can update orders assigned to them" ON orders FOR UPDATE USING (delivery_agent_id IN (SELECT id FROM delivery_agents WHERE user_id = auth.uid()));
    END IF;
END $$;

-- Add system policy for order assignment (allows assignment without specific user context)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'orders' 
        AND policyname = 'System can assign delivery agents to orders'
    ) THEN
        CREATE POLICY "System can assign delivery agents to orders" ON orders FOR UPDATE USING (true);
    END IF;
END $$;

-- Verify policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'orders' 
ORDER BY policyname;
