-- =====================================================
-- BLINKIT CLONE - DATABASE SCHEMA
-- =====================================================
-- Complete database schema for the Blinkit Clone application
-- This file creates all tables, indexes, functions, and triggers
-- Run this file first to set up the database structure
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =====================================================
-- CORE PRODUCT CATALOG TABLES
-- =====================================================

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    icon_url TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    brand VARCHAR(100),
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    mrp DECIMAL(10,2) CHECK (mrp >= price),
    unit VARCHAR(50) NOT NULL,
    image_url TEXT,
    images TEXT[],
    tags TEXT[],
    delivery_time INTEGER DEFAULT 15,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    location GEOGRAPHY(POINT, 4326),
    phone VARCHAR(20),
    email VARCHAR(100),
    delivery_radius_km DECIMAL(5,2) DEFAULT 10.0,
    operating_hours JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
    reorder_level INTEGER DEFAULT 10,
    last_restocked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(store_id, product_id)
);

-- =====================================================
-- USER MANAGEMENT TABLES
-- =====================================================

CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(20) DEFAULT 'other' CHECK (type IN ('home', 'work', 'other')),
    address_line_1 TEXT NOT NULL,
    address_line_2 TEXT,
    landmark TEXT,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) DEFAULT 'India',
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    location GEOGRAPHY(POINT, 4326),
    formatted_address TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- =====================================================
-- DELIVERY AGENT TABLES
-- =====================================================

CREATE TABLE delivery_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    full_name VARCHAR(200) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    vehicle_type VARCHAR(20) NOT NULL CHECK (vehicle_type IN ('bike', 'scooter', 'bicycle', 'car')),
    vehicle_number VARCHAR(20) NOT NULL,
    vehicle_model VARCHAR(100),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    location GEOGRAPHY(POINT, 4326),
    last_location_update TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('offline', 'available', 'busy', 'delivering')),
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    total_deliveries INTEGER DEFAULT 0,
    successful_deliveries INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_earnings DECIMAL(10,2) DEFAULT 0.00,
    working_hours JSONB,
    max_concurrent_orders INTEGER DEFAULT 3,
    delivery_radius_km DECIMAL(5,2) DEFAULT 5.0,
    license_number VARCHAR(50),
    license_expiry DATE,
    documents JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ORDER MANAGEMENT TABLES
-- =====================================================

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id),
    delivery_agent_id UUID REFERENCES delivery_agents(id),
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN (
        'pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'
    )),
    items_total DECIMAL(10,2) NOT NULL DEFAULT 0,
    delivery_charge DECIMAL(10,2) NOT NULL DEFAULT 0,
    handling_charge DECIMAL(10,2) NOT NULL DEFAULT 0,
    donation_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    delivery_address TEXT NOT NULL,
    delivery_latitude DECIMAL(10,8),
    delivery_longitude DECIMAL(11,8),
    delivery_location GEOGRAPHY(POINT, 4326),
    user_current_latitude DECIMAL(10,8),
    user_current_longitude DECIMAL(11,8),
    user_location_updated_at TIMESTAMP WITH TIME ZONE,
    payment_method VARCHAR(20) DEFAULT 'cod' CHECK (payment_method IN ('cod', 'online', 'wallet')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_id TEXT,
    notes TEXT,
    estimated_delivery_time TIMESTAMP WITH TIME ZONE,
    assigned_at TIMESTAMP WITH TIME ZONE,
    pickup_started_at TIMESTAMP WITH TIME ZONE,
    delivery_started_at TIMESTAMP WITH TIME ZONE,
    estimated_pickup_time TIMESTAMP WITH TIME ZONE,
    actual_pickup_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL, -- Added for frontend compatibility
    product_name VARCHAR(200) NOT NULL,
    product_unit VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- DELIVERY TRACKING TABLES
-- =====================================================

CREATE TABLE delivery_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES delivery_agents(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL CHECK (status IN (
        'assigned', 'agent_notified', 'pickup_started', 'picked_up', 
        'in_transit', 'near_destination', 'delivered', 'failed', 'cancelled'
    )),
    agent_latitude DECIMAL(10,8),
    agent_longitude DECIMAL(11,8),
    agent_location GEOGRAPHY(POINT, 4326),
    distance_to_customer_km DECIMAL(8,2),
    estimated_arrival_time TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    proof_of_delivery JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE agent_location_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES delivery_agents(id) ON DELETE CASCADE,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    location GEOGRAPHY(POINT, 4326),
    accuracy DECIMAL(8,2),
    speed DECIMAL(6,2),
    heading DECIMAL(5,2),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- NOTIFICATIONS TABLES
-- =====================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'order_update')),
    is_read BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- =====================================================
-- PERFORMANCE AND EARNINGS TABLES
-- =====================================================

CREATE TABLE agent_earnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES delivery_agents(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    base_fee DECIMAL(8,2) NOT NULL DEFAULT 0,
    distance_fee DECIMAL(8,2) NOT NULL DEFAULT 0,
    time_bonus DECIMAL(8,2) NOT NULL DEFAULT 0,
    tip_amount DECIMAL(8,2) NOT NULL DEFAULT 0,
    total_earning DECIMAL(8,2) NOT NULL DEFAULT 0,
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
    paid_at TIMESTAMP WITH TIME ZONE,
    delivery_time_minutes INTEGER,
    customer_rating INTEGER CHECK (customer_rating BETWEEN 1 AND 5),
    customer_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Core indexes
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_stores_location ON stores USING gist(location);
CREATE INDEX idx_inventory_store_product ON inventory(store_id, product_id);

-- User indexes
CREATE INDEX idx_addresses_user ON addresses(user_id);
CREATE INDEX idx_cart_user ON cart_items(user_id);

-- Agent indexes
CREATE INDEX idx_delivery_agents_user ON delivery_agents(user_id);
CREATE INDEX idx_delivery_agents_status ON delivery_agents(status);
CREATE INDEX idx_delivery_agents_location ON delivery_agents USING gist(location);

-- Order indexes
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_agent ON orders(delivery_agent_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- Tracking indexes
CREATE INDEX idx_delivery_tracking_order ON delivery_tracking(order_id);
CREATE INDEX idx_delivery_tracking_agent ON delivery_tracking(agent_id);
CREATE INDEX idx_agent_location_history_agent ON agent_location_history(agent_id);

-- Notification indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_agent_notifications_agent ON agent_notifications(agent_id);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Update location geography
CREATE OR REPLACE FUNCTION update_location_geography()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Specific function for orders table with delivery_latitude/delivery_longitude
CREATE OR REPLACE FUNCTION update_orders_location_geography()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.delivery_latitude IS NOT NULL AND NEW.delivery_longitude IS NOT NULL THEN
        NEW.delivery_location = ST_SetSRID(ST_MakePoint(NEW.delivery_longitude, NEW.delivery_latitude), 4326);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply location triggers
CREATE TRIGGER trigger_stores_location BEFORE INSERT OR UPDATE ON stores FOR EACH ROW EXECUTE FUNCTION update_location_geography();
CREATE TRIGGER trigger_addresses_location BEFORE INSERT OR UPDATE ON addresses FOR EACH ROW EXECUTE FUNCTION update_location_geography();
CREATE TRIGGER trigger_orders_location BEFORE INSERT OR UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_orders_location_geography();
CREATE TRIGGER trigger_delivery_agents_location BEFORE INSERT OR UPDATE ON delivery_agents FOR EACH ROW EXECUTE FUNCTION update_location_geography();

-- Timestamp triggers
CREATE TRIGGER trigger_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_stores_updated_at BEFORE UPDATE ON stores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_delivery_agents_updated_at BEFORE UPDATE ON delivery_agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Find available agents
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
        ROUND(ST_Distance(ST_SetSRID(ST_MakePoint(order_lng, order_lat), 4326)::geography, da.location) / 1000, 2) as distance_km,
        COALESCE((SELECT COUNT(*) FROM orders o WHERE o.delivery_agent_id = da.id AND o.status IN ('confirmed', 'preparing', 'out_for_delivery')), 0)::INTEGER as current_orders
    FROM delivery_agents da
    WHERE da.status = 'available'
    AND da.is_active = true
    AND da.is_verified = true
    AND da.location IS NOT NULL
    AND ST_DWithin(ST_SetSRID(ST_MakePoint(order_lng, order_lat), 4326)::geography, da.location, radius_km * 1000)
    AND COALESCE((SELECT COUNT(*) FROM orders o WHERE o.delivery_agent_id = da.id AND o.status IN ('confirmed', 'preparing', 'out_for_delivery')), 0) < da.max_concurrent_orders
    ORDER BY distance_km, current_orders
    LIMIT max_agents;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_notifications ENABLE ROW LEVEL SECURITY;

-- User policies
CREATE POLICY "Users can manage their own data" ON addresses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own cart" ON cart_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own orders" ON orders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own notifications" ON notifications FOR ALL USING (auth.uid() = user_id);

-- Agent policies
CREATE POLICY "Agents can view orders assigned to them" ON orders FOR SELECT USING (delivery_agent_id IN (SELECT id FROM delivery_agents WHERE user_id = auth.uid()));
CREATE POLICY "Agents can update orders assigned to them" ON orders FOR UPDATE USING (delivery_agent_id IN (SELECT id FROM delivery_agents WHERE user_id = auth.uid()));

-- System policies for order assignment
CREATE POLICY "System can assign delivery agents to orders" ON orders FOR UPDATE USING (true);
CREATE POLICY "Agents can insert their own profile" ON delivery_agents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Agents can view and update their own profile" ON delivery_agents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Agents can update their own profile" ON delivery_agents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Agents can view their own notifications" ON agent_notifications FOR ALL USING (agent_id IN (SELECT id FROM delivery_agents WHERE user_id = auth.uid()));
