-- =====================================================
-- FIX DELIVERY AGENT ORDER ACCESS
-- =====================================================
-- This script adds missing RLS policies to allow delivery agents
-- to view unassigned orders for manual acceptance
-- =====================================================

-- Add policy for delivery agents to view unassigned orders
CREATE POLICY "Agents can view unassigned orders" ON orders 
FOR SELECT 
USING (
  delivery_agent_id IS NULL 
  AND status = 'confirmed'
  AND EXISTS (
    SELECT 1 FROM delivery_agents 
    WHERE user_id = auth.uid() 
    AND status IN ('available', 'online', 'busy')
  )
);

-- Add policy for delivery agents to accept unassigned orders
CREATE POLICY "Agents can accept unassigned orders" ON orders 
FOR UPDATE 
USING (
  delivery_agent_id IS NULL 
  AND status = 'confirmed'
  AND EXISTS (
    SELECT 1 FROM delivery_agents 
    WHERE user_id = auth.uid() 
    AND status IN ('available', 'online', 'busy')
  )
);

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'orders' 
AND policyname IN ('Agents can view unassigned orders', 'Agents can accept unassigned orders');
