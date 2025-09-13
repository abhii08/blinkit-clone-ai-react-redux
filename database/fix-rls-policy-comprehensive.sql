-- =====================================================
-- COMPREHENSIVE RLS POLICY FIX FOR ORDER ASSIGNMENT
-- =====================================================
-- This script completely rebuilds the RLS policies for orders
-- to ensure delivery agents can properly accept orders
-- =====================================================

-- Drop all existing order policies to start fresh
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can create their own orders" ON orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON orders;
DROP POLICY IF EXISTS "Agents can view orders assigned to them" ON orders;
DROP POLICY IF EXISTS "Agents can update orders assigned to them" ON orders;
DROP POLICY IF EXISTS "System can assign delivery agents to orders" ON orders;
DROP POLICY IF EXISTS "Agents can view unassigned orders" ON orders;
DROP POLICY IF EXISTS "Agents can accept unassigned orders" ON orders;
DROP POLICY IF EXISTS "Agents can assign themselves to orders" ON orders;

-- Recreate user policies
CREATE POLICY "Users can view their own orders" ON orders 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" ON orders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders" ON orders 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Recreate agent policies with proper permissions
CREATE POLICY "Agents can view all orders for assignment" ON orders 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM delivery_agents 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);

CREATE POLICY "Agents can accept and update orders" ON orders 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM delivery_agents 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
)
WITH CHECK (
  -- Allow agents to assign orders to themselves or update their assigned orders
  delivery_agent_id IN (
    SELECT id FROM delivery_agents WHERE user_id = auth.uid()
  )
);

-- Verify all policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'orders' 
ORDER BY policyname;
