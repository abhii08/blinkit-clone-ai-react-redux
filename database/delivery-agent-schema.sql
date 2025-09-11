-- =====================================================
-- BLINKIT CLONE - DELIVERY AGENT APP DATABASE SCHEMA
-- =====================================================
-- This schema supports the delivery agent application
-- Features: Agent Management, Order Assignment, Real-time Tracking, Status Updates
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =====================================================
-- DELIVERY AGENT MANAGEMENT
-- =====================================================

-- Delivery agents table with comprehensive agent information
CREATE TABLE delivery_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- Personal Information
    full_name VARCHAR(200) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    
    -- Vehicle Information
    vehicle_type VARCHAR(20) NOT NULL CHECK (vehicle_type IN ('bike', 'scooter', 'bicycle', 'car')),
    vehicle_number VARCHAR(20) NOT NULL,
    vehicle_model VARCHAR(100),
    
    -- Location and Status
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    location GEOGRAPHY(POINT, 4326),
    last_location_update TIMESTAMP WITH TIME ZONE,
    
    -- Agent Status
    status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('offline', 'available', 'busy', 'delivering')),
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    
    -- Performance Metrics
    total_deliveries INTEGER DEFAULT 0,
    successful_deliveries INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_earnings DECIMAL(10,2) DEFAULT 0.00,
    
    -- Working Hours and Availability
    working_hours JSONB, -- Store working hours preference
    max_concurrent_orders INTEGER DEFAULT 3,
    delivery_radius_km DECIMAL(5,2) DEFAULT 5.0,
    
    -- Documents and Verification
    license_number VARCHAR(50),
    license_expiry DATE,
    documents JSONB, -- Store document URLs and verification status
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent location history for tracking
CREATE TABLE agent_location_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES delivery_agents(id) ON DELETE CASCADE,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    location GEOGRAPHY(POINT, 4326),
    accuracy DECIMAL(8,2), -- GPS accuracy in meters
    speed DECIMAL(6,2), -- Speed in km/h
    heading DECIMAL(5,2), -- Direction in degrees
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ORDER ASSIGNMENT AND TRACKING
-- =====================================================

-- Update orders table to include delivery agent assignment
-- This extends the orders table from user-app-schema.sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_agent_id UUID REFERENCES delivery_agents(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_pickup_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS actual_pickup_time TIMESTAMP WITH TIME ZONE;

-- Delivery tracking with real-time updates
CREATE TABLE delivery_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES delivery_agents(id) ON DELETE CASCADE,
    
    -- Status tracking
    status VARCHAR(30) NOT NULL CHECK (status IN (
        'assigned', 'agent_notified', 'pickup_started', 'picked_up', 
        'in_transit', 'near_destination', 'delivered', 'failed', 'cancelled'
    )),
    
    -- Location tracking
    agent_latitude DECIMAL(10,8),
    agent_longitude DECIMAL(11,8),
    agent_location GEOGRAPHY(POINT, 4326),
    
    -- Distance and time estimates
    distance_to_customer_km DECIMAL(8,2),
    estimated_arrival_time TIMESTAMP WITH TIME ZONE,
    
    -- Additional information
    notes TEXT,
    proof_of_delivery JSONB, -- Photos, signatures, etc.
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent earnings and payments
CREATE TABLE agent_earnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES delivery_agents(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    
    -- Earning breakdown
    base_fee DECIMAL(8,2) NOT NULL DEFAULT 0,
    distance_fee DECIMAL(8,2) NOT NULL DEFAULT 0,
    time_bonus DECIMAL(8,2) NOT NULL DEFAULT 0,
    tip_amount DECIMAL(8,2) NOT NULL DEFAULT 0,
    total_earning DECIMAL(8,2) NOT NULL DEFAULT 0,
    
    -- Payment status
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- Performance metrics
    delivery_time_minutes INTEGER,
    customer_rating INTEGER CHECK (customer_rating BETWEEN 1 AND 5),
    customer_feedback TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- AGENT NOTIFICATIONS AND COMMUNICATION
-- =====================================================

-- Agent-specific notifications
CREATE TABLE agent_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES delivery_agents(id) ON DELETE CASCADE,
    
    -- Notification details
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) DEFAULT 'info' CHECK (type IN (
        'info', 'order_assigned', 'order_cancelled', 'payment_received', 
        'rating_received', 'system_alert', 'promotion'
    )),
    
    -- Notification status
    is_read BOOLEAN DEFAULT false,
    is_pushed BOOLEAN DEFAULT false, -- Whether push notification was sent
    
    -- Additional data
    metadata JSONB, -- Order ID, payment info, etc.
    action_url TEXT, -- Deep link for mobile app
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Agent availability schedule
CREATE TABLE agent_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES delivery_agents(id) ON DELETE CASCADE,
    
    -- Schedule information
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    
    -- Break times
    break_start_time TIME,
    break_end_time TIME,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(agent_id, day_of_week)
);

-- =====================================================
-- PERFORMANCE AND ANALYTICS
-- =====================================================

-- Agent performance metrics
CREATE TABLE agent_performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES delivery_agents(id) ON DELETE CASCADE,
    
    -- Time period
    date DATE NOT NULL,
    
    -- Delivery metrics
    total_orders INTEGER DEFAULT 0,
    completed_orders INTEGER DEFAULT 0,
    cancelled_orders INTEGER DEFAULT 0,
    average_delivery_time_minutes DECIMAL(6,2) DEFAULT 0,
    
    -- Distance and efficiency
    total_distance_km DECIMAL(8,2) DEFAULT 0,
    total_online_hours DECIMAL(6,2) DEFAULT 0,
    orders_per_hour DECIMAL(4,2) DEFAULT 0,
    
    -- Customer satisfaction
    average_rating DECIMAL(3,2) DEFAULT 0,
    total_ratings INTEGER DEFAULT 0,
    five_star_ratings INTEGER DEFAULT 0,
    
    -- Earnings
    total_earnings DECIMAL(10,2) DEFAULT 0,
    total_tips DECIMAL(8,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(agent_id, date)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Delivery agents indexes
CREATE INDEX idx_delivery_agents_user ON delivery_agents(user_id);
CREATE INDEX idx_delivery_agents_status ON delivery_agents(status);
CREATE INDEX idx_delivery_agents_location ON delivery_agents USING gist(location);
CREATE INDEX idx_delivery_agents_active ON delivery_agents(is_active);
CREATE INDEX idx_delivery_agents_available ON delivery_agents(status) WHERE status = 'available';

-- Location history indexes
CREATE INDEX idx_agent_location_history_agent ON agent_location_history(agent_id);
CREATE INDEX idx_agent_location_history_time ON agent_location_history(recorded_at DESC);
CREATE INDEX idx_agent_location_history_location ON agent_location_history USING gist(location);

-- Delivery tracking indexes
CREATE INDEX idx_delivery_tracking_order ON delivery_tracking(order_id);
CREATE INDEX idx_delivery_tracking_agent ON delivery_tracking(agent_id);
CREATE INDEX idx_delivery_tracking_status ON delivery_tracking(status);
CREATE INDEX idx_delivery_tracking_location ON delivery_tracking USING gist(agent_location);

-- Orders delivery agent index
CREATE INDEX idx_orders_delivery_agent ON orders(delivery_agent_id);
CREATE INDEX idx_orders_agent_status ON orders(delivery_agent_id, status);

-- Agent earnings indexes
CREATE INDEX idx_agent_earnings_agent ON agent_earnings(agent_id);
CREATE INDEX idx_agent_earnings_order ON agent_earnings(order_id);
CREATE INDEX idx_agent_earnings_date ON agent_earnings(created_at DESC);

-- Agent notifications indexes
CREATE INDEX idx_agent_notifications_agent ON agent_notifications(agent_id);
CREATE INDEX idx_agent_notifications_unread ON agent_notifications(agent_id, is_read);
CREATE INDEX idx_agent_notifications_type ON agent_notifications(type);

-- Performance metrics indexes
CREATE INDEX idx_agent_performance_agent ON agent_performance_metrics(agent_id);
CREATE INDEX idx_agent_performance_date ON agent_performance_metrics(date DESC);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Update agent location geography
CREATE TRIGGER trigger_delivery_agents_location
    BEFORE INSERT OR UPDATE ON delivery_agents
    FOR EACH ROW
    EXECUTE FUNCTION update_location_geography();

-- Update location history geography
CREATE TRIGGER trigger_agent_location_history_location
    BEFORE INSERT OR UPDATE ON agent_location_history
    FOR EACH ROW
    EXECUTE FUNCTION update_location_geography();

-- Update delivery tracking location
CREATE TRIGGER trigger_delivery_tracking_location
    BEFORE INSERT OR UPDATE ON delivery_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_location_geography();

-- Update timestamps
CREATE TRIGGER trigger_delivery_agents_updated_at BEFORE UPDATE ON delivery_agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_delivery_tracking_updated_at BEFORE UPDATE ON delivery_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_agent_availability_updated_at BEFORE UPDATE ON agent_availability FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update last active timestamp when agent status changes
CREATE OR REPLACE FUNCTION update_agent_last_active()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status != OLD.status THEN
        NEW.last_active_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_agent_last_active
    BEFORE UPDATE ON delivery_agents
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_last_active();

-- =====================================================
-- UTILITY FUNCTIONS FOR DELIVERY AGENTS
-- =====================================================

-- Function to find available agents near a location
CREATE OR REPLACE FUNCTION find_available_agents(
    order_lat DECIMAL,
    order_lng DECIMAL,
    radius_km DECIMAL DEFAULT 5,
    max_agents INTEGER DEFAULT 10
)
RETURNS TABLE (
    agent_id UUID,
    agent_name VARCHAR,
    vehicle_type VARCHAR,
    distance_km DECIMAL,
    current_orders INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        da.id,
        da.full_name,
        da.vehicle_type,
        ROUND(
            ST_Distance(
                ST_SetSRID(ST_MakePoint(order_lng, order_lat), 4326)::geography,
                da.location
            ) / 1000, 2
        ) as distance_km,
        COALESCE(
            (SELECT COUNT(*) FROM orders o 
             WHERE o.delivery_agent_id = da.id 
             AND o.status IN ('confirmed', 'preparing', 'out_for_delivery')), 
            0
        )::INTEGER as current_orders
    FROM delivery_agents da
    WHERE da.status = 'available'
    AND da.is_active = true
    AND da.is_verified = true
    AND da.location IS NOT NULL
    AND ST_DWithin(
        ST_SetSRID(ST_MakePoint(order_lng, order_lat), 4326)::geography,
        da.location,
        radius_km * 1000
    )
    AND COALESCE(
        (SELECT COUNT(*) FROM orders o 
         WHERE o.delivery_agent_id = da.id 
         AND o.status IN ('confirmed', 'preparing', 'out_for_delivery')), 
        0
    ) < da.max_concurrent_orders
    ORDER BY distance_km, current_orders
    LIMIT max_agents;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-assign order to nearest available agent
CREATE OR REPLACE FUNCTION auto_assign_order(
    p_order_id UUID,
    p_max_distance_km DECIMAL DEFAULT 5
)
RETURNS UUID AS $$
DECLARE
    selected_agent_id UUID;
    order_location RECORD;
BEGIN
    -- Get order location
    SELECT delivery_latitude, delivery_longitude
    INTO order_location
    FROM orders
    WHERE id = p_order_id;
    
    IF order_location IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Find the best available agent
    SELECT agent_id
    INTO selected_agent_id
    FROM find_available_agents(
        order_location.delivery_latitude,
        order_location.delivery_longitude,
        p_max_distance_km,
        1
    )
    LIMIT 1;
    
    -- Assign the order if agent found
    IF selected_agent_id IS NOT NULL THEN
        UPDATE orders
        SET 
            delivery_agent_id = selected_agent_id,
            assigned_at = NOW(),
            status = 'confirmed',
            updated_at = NOW()
        WHERE id = p_order_id;
        
        -- Update agent status
        UPDATE delivery_agents
        SET 
            status = 'busy',
            updated_at = NOW()
        WHERE id = selected_agent_id;
        
        -- Create delivery tracking record
        INSERT INTO delivery_tracking (order_id, agent_id, status)
        VALUES (p_order_id, selected_agent_id, 'assigned');
    END IF;
    
    RETURN selected_agent_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate agent earnings
CREATE OR REPLACE FUNCTION calculate_agent_earnings(
    p_agent_id UUID,
    p_order_id UUID,
    p_delivery_time_minutes INTEGER DEFAULT NULL
)
RETURNS DECIMAL AS $$
DECLARE
    base_fee DECIMAL := 25.00;
    distance_rate DECIMAL := 2.00; -- per km
    time_bonus DECIMAL := 0.00;
    order_total DECIMAL;
    delivery_distance DECIMAL;
    total_earning DECIMAL;
BEGIN
    -- Get order total for percentage calculation
    SELECT total_amount INTO order_total
    FROM orders WHERE id = p_order_id;
    
    -- Calculate distance-based fee (simplified - would use actual route distance)
    SELECT 5.0 INTO delivery_distance; -- Placeholder
    
    -- Time bonus for fast delivery (under 20 minutes)
    IF p_delivery_time_minutes IS NOT NULL AND p_delivery_time_minutes < 20 THEN
        time_bonus := 10.00;
    END IF;
    
    total_earning := base_fee + (delivery_distance * distance_rate) + time_bonus;
    
    -- Insert earning record
    INSERT INTO agent_earnings (
        agent_id, order_id, base_fee, distance_fee, time_bonus, total_earning, delivery_time_minutes
    ) VALUES (
        p_agent_id, p_order_id, base_fee, (delivery_distance * distance_rate), time_bonus, total_earning, p_delivery_time_minutes
    );
    
    -- Update agent total earnings
    UPDATE delivery_agents
    SET total_earnings = total_earnings + total_earning
    WHERE id = p_agent_id;
    
    RETURN total_earning;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on agent-specific tables
ALTER TABLE delivery_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_location_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_availability ENABLE ROW LEVEL SECURITY;

-- Policies for delivery_agents
CREATE POLICY "Agents can view their own profile" ON delivery_agents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Agents can update their own profile" ON delivery_agents
    FOR UPDATE USING (auth.uid() = user_id);

-- Policies for agent_location_history
CREATE POLICY "Agents can view their own location history" ON agent_location_history
    FOR SELECT USING (
        agent_id IN (SELECT id FROM delivery_agents WHERE user_id = auth.uid())
    );

CREATE POLICY "Agents can insert their own location" ON agent_location_history
    FOR INSERT WITH CHECK (
        agent_id IN (SELECT id FROM delivery_agents WHERE user_id = auth.uid())
    );

-- Policies for delivery_tracking
CREATE POLICY "Agents can view their own deliveries" ON delivery_tracking
    FOR SELECT USING (
        agent_id IN (SELECT id FROM delivery_agents WHERE user_id = auth.uid())
    );

CREATE POLICY "Agents can update their own deliveries" ON delivery_tracking
    FOR UPDATE USING (
        agent_id IN (SELECT id FROM delivery_agents WHERE user_id = auth.uid())
    );

-- Policies for agent_earnings
CREATE POLICY "Agents can view their own earnings" ON agent_earnings
    FOR SELECT USING (
        agent_id IN (SELECT id FROM delivery_agents WHERE user_id = auth.uid())
    );

-- Policies for agent_notifications
CREATE POLICY "Agents can view their own notifications" ON agent_notifications
    FOR SELECT USING (
        agent_id IN (SELECT id FROM delivery_agents WHERE user_id = auth.uid())
    );

CREATE POLICY "Agents can update their own notifications" ON agent_notifications
    FOR UPDATE USING (
        agent_id IN (SELECT id FROM delivery_agents WHERE user_id = auth.uid())
    );

-- =====================================================
-- SAMPLE DATA STRUCTURE COMMENTS
-- =====================================================

/*
Sample Delivery Agent Flow:
1. Agent signs up through DeliveryAuthModal
2. Profile created in delivery_agents table
3. Agent goes online (status = 'available')
4. Location tracked in agent_location_history
5. Orders auto-assigned based on proximity
6. Real-time tracking through delivery_tracking
7. Earnings calculated and stored
8. Performance metrics updated daily

Agent Status Flow:
offline -> available -> busy -> delivering -> available
                    -> offline

Order Assignment Flow:
1. New order created
2. auto_assign_order() function called
3. Nearest available agent found
4. Order assigned, agent status = 'busy'
5. Delivery tracking record created
6. Agent receives notification
7. Agent updates status through delivery process
8. Earnings calculated on completion
*/
