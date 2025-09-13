-- =====================================================
-- FIX ORDER STATUS FLOW
-- =====================================================
-- This script updates the RLS policies to handle the new
-- order status flow: pending -> confirmed -> preparing
-- =====================================================

-- Update the agent view policy to include pending orders
DROP POLICY IF EXISTS "Agents can view all orders for assignment" ON orders;

CREATE POLICY "Agents can view all orders for assignment" ON orders 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM delivery_agents 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);

-- Update real-time subscription filters to listen for pending orders
-- Note: This is a reminder to update the frontend real-time subscriptions
-- to listen for status='pending' instead of status='confirmed'

-- Verify the policy was updated
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'orders' 
AND policyname = 'Agents can view all orders for assignment';
