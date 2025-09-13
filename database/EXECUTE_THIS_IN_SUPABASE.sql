-- =====================================================
-- EXECUTE THIS SCRIPT IN SUPABASE SQL EDITOR
-- =====================================================
-- This fixes the PATCH 406 error in order assignment
-- Copy and paste this entire script into Supabase SQL Editor and run it
-- =====================================================

-- Add missing UPDATE policy for users on their own orders
CREATE POLICY "Users can update their own orders" ON orders FOR UPDATE USING (auth.uid() = user_id);

-- Add system policy for order assignment (allows assignment without specific user context)
CREATE POLICY "System can assign delivery agents to orders" ON orders FOR UPDATE USING (true);

-- Add policy for agents to view orders assigned to them
CREATE POLICY "Agents can view orders assigned to them" ON orders FOR SELECT USING (delivery_agent_id IN (SELECT id FROM delivery_agents WHERE user_id = auth.uid()));

-- Add policy for agents to update orders assigned to them
CREATE POLICY "Agents can update orders assigned to them" ON orders FOR UPDATE USING (delivery_agent_id IN (SELECT id FROM delivery_agents WHERE user_id = auth.uid()));

-- Verify policies were created successfully
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'orders' 
ORDER BY policyname;
