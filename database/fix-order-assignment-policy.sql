-- =====================================================
-- FIX ORDER ASSIGNMENT RLS POLICY
-- =====================================================
-- This script fixes the RLS policy that prevents agents
-- from assigning themselves to orders
-- =====================================================

-- Drop the restrictive update policy
DROP POLICY IF EXISTS "Agents can accept unassigned orders" ON orders;

-- Create a more permissive policy for agents to assign themselves to orders
CREATE POLICY "Agents can assign themselves to orders" ON orders 
FOR UPDATE 
USING (
  -- Allow if order is unassigned OR being assigned to this agent
  (
    delivery_agent_id IS NULL 
    OR delivery_agent_id IN (
      SELECT id FROM delivery_agents WHERE user_id = auth.uid()
    )
  )
  AND status IN ('confirmed', 'preparing', 'out_for_delivery', 'delivered')
  AND EXISTS (
    SELECT 1 FROM delivery_agents 
    WHERE user_id = auth.uid() 
    AND status IN ('available', 'online', 'busy')
  )
)
WITH CHECK (
  -- Allow assignment to this agent or keeping existing assignment
  delivery_agent_id IN (
    SELECT id FROM delivery_agents WHERE user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM delivery_agents 
    WHERE user_id = auth.uid() 
    AND status IN ('available', 'online', 'busy')
  )
);

-- Verify the policy was updated
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'orders' 
AND policyname = 'Agents can assign themselves to orders';
