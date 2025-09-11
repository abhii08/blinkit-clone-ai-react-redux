-- =====================================================
-- BLINKIT CLONE - SEED DATA
-- =====================================================
-- Sample data for Product Catalog
-- Run this AFTER running complete-schema.sql
-- =====================================================

-- Insert Categories
INSERT INTO categories (name, slug, description, image_url, sort_order) VALUES
('Dairy, Bread & Eggs', 'dairy-bread-eggs', 'Fresh dairy products, bread and eggs', 'https://cdn.grofers.com/layout-engine/2022-05/paan-corner_web.png', 1),
('Sweet Tooth', 'sweet-tooth', 'Chocolates, candies and sweet treats', 'https://cdn.grofers.com/layout-engine/2022-05/Slice-2_4.png', 2),
('Snacks & Munchies', 'snacks-munchies', 'Chips, namkeen and quick bites', 'https://cdn.grofers.com/layout-engine/2022-05/Slice-3_4.png', 3),
('Cold Drinks & Juices', 'cold-drinks-juices', 'Refreshing beverages and juices', 'https://cdn.grofers.com/layout-engine/2022-05/Slice-4_9.png', 4),
('Fruits & Vegetables', 'fruits-vegetables', 'Fresh fruits and vegetables', 'https://cdn.grofers.com/layout-engine/2022-05/Slice-5_4.png', 5),
('Personal Care', 'personal-care', 'Health and hygiene products', 'https://cdn.grofers.com/layout-engine/2022-05/Slice-6_5.png', 6);

-- Insert Products for Dairy, Bread & Eggs
INSERT INTO products (category_id, name, description, brand, price, mrp, unit, image_url, delivery_time) VALUES
((SELECT id FROM categories WHERE slug = 'dairy-bread-eggs'), 'Amul Fresh Milk', 'Fresh full cream milk', 'Amul', 28.00, 30.00, '500ml', 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=400&fit=crop', 15),
((SELECT id FROM categories WHERE slug = 'dairy-bread-eggs'), 'Britannia Bread', 'Soft white bread loaf', 'Britannia', 25.00, 27.00, '400g', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop', 15),
((SELECT id FROM categories WHERE slug = 'dairy-bread-eggs'), 'Farm Fresh Eggs', 'Fresh brown eggs', 'Keggs', 84.00, 90.00, '6 pieces', 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&h=400&fit=crop', 15),
((SELECT id FROM categories WHERE slug = 'dairy-bread-eggs'), 'Amul Butter', 'Fresh salted butter', 'Amul', 56.00, 60.00, '100g', 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&h=400&fit=crop', 15),
((SELECT id FROM categories WHERE slug = 'dairy-bread-eggs'), 'Mother Dairy Curd', 'Fresh thick curd', 'Mother Dairy', 30.00, 32.00, '400g', 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400&h=400&fit=crop', 15),
((SELECT id FROM categories WHERE slug = 'dairy-bread-eggs'), 'Amul Cheese Slices', 'Processed cheese slices', 'Amul', 125.00, 130.00, '200g', 'https://images.unsplash.com/photo-1552767059-ce182ead6c1b?w=400&h=400&fit=crop', 15);

-- Insert Products for Sweet Tooth
INSERT INTO products (category_id, name, description, brand, price, mrp, unit, image_url, delivery_time) VALUES
((SELECT id FROM categories WHERE slug = 'sweet-tooth'), 'Cadbury Dairy Milk', 'Creamy milk chocolate', 'Cadbury', 45.00, 50.00, '55g', 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400&h=400&fit=crop', 15),
((SELECT id FROM categories WHERE slug = 'sweet-tooth'), 'KitKat Chocolate', 'Crispy wafer chocolate', 'Nestle', 20.00, 22.00, '27.5g', 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=400&h=400&fit=crop', 15),
((SELECT id FROM categories WHERE slug = 'sweet-tooth'), 'Ferrero Rocher', 'Premium hazelnut chocolate', 'Ferrero', 399.00, 450.00, '200g', 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=400&h=400&fit=crop', 15),
((SELECT id FROM categories WHERE slug = 'sweet-tooth'), 'Parle-G Biscuits', 'Classic glucose biscuits', 'Parle', 25.00, 27.00, '376g', 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=400&fit=crop', 15),
((SELECT id FROM categories WHERE slug = 'sweet-tooth'), 'Oreo Cookies', 'Chocolate cream cookies', 'Oreo', 30.00, 35.00, '120g', 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&h=400&fit=crop', 15);

-- Insert Products for Snacks & Munchies
INSERT INTO products (category_id, name, description, brand, price, mrp, unit, image_url, delivery_time) VALUES
((SELECT id FROM categories WHERE slug = 'snacks-munchies'), 'Lays Classic Chips', 'Crispy potato chips', 'Lays', 20.00, 22.00, '52g', 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&h=400&fit=crop', 15),
((SELECT id FROM categories WHERE slug = 'snacks-munchies'), 'Kurkure Masala Munch', 'Spicy corn puffs', 'Kurkure', 20.00, 22.00, '55g', 'https://images.unsplash.com/photo-1613919113640-25732ec5e61f?w=400&h=400&fit=crop', 15),
((SELECT id FROM categories WHERE slug = 'snacks-munchies'), 'Haldirams Bhujia', 'Traditional namkeen', 'Haldirams', 45.00, 50.00, '200g', 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&h=400&fit=crop', 15),
((SELECT id FROM categories WHERE slug = 'snacks-munchies'), 'Maggi Noodles', 'Instant masala noodles', 'Maggi', 14.00, 15.00, '70g', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=400&fit=crop', 15),
((SELECT id FROM categories WHERE slug = 'snacks-munchies'), 'Britannia Good Day', 'Butter cookies', 'Britannia', 35.00, 40.00, '216g', 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=400&h=400&fit=crop', 15);

-- Insert Products for Cold Drinks & Juices
INSERT INTO products (category_id, name, description, brand, price, mrp, unit, image_url, delivery_time) VALUES
((SELECT id FROM categories WHERE slug = 'cold-drinks-juices'), 'Coca Cola', 'Classic cola drink', 'Coca Cola', 40.00, 45.00, '600ml', 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=400&h=400&fit=crop', 15),
((SELECT id FROM categories WHERE slug = 'cold-drinks-juices'), 'Pepsi', 'Refreshing cola', 'Pepsi', 40.00, 45.00, '600ml', 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400&h=400&fit=crop', 15),
((SELECT id FROM categories WHERE slug = 'cold-drinks-juices'), 'Real Mango Juice', 'Pure mango juice', 'Real', 35.00, 40.00, '200ml', 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=400&fit=crop', 15),
((SELECT id FROM categories WHERE slug = 'cold-drinks-juices'), 'Frooti Mango Drink', 'Mango flavored drink', 'Frooti', 20.00, 22.00, '160ml', 'https://images.unsplash.com/photo-1546173159-315724a31696?w=400&h=400&fit=crop', 15),
((SELECT id FROM categories WHERE slug = 'cold-drinks-juices'), 'Sprite', 'Lemon lime soda', 'Sprite', 40.00, 45.00, '600ml', 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=400&h=400&fit=crop', 15);

-- Insert Products for Fruits & Vegetables
INSERT INTO products (category_id, name, description, brand, price, mrp, unit, image_url, delivery_time) VALUES
((SELECT id FROM categories WHERE slug = 'fruits-vegetables'), 'Fresh Bananas', 'Ripe yellow bananas', 'Fresh', 40.00, 45.00, '1kg', 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=400&fit=crop', 15),
((SELECT id FROM categories WHERE slug = 'fruits-vegetables'), 'Red Apples', 'Crispy red apples', 'Fresh', 120.00, 130.00, '1kg', 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&h=400&fit=crop', 15),
((SELECT id FROM categories WHERE slug = 'fruits-vegetables'), 'Fresh Tomatoes', 'Red ripe tomatoes', 'Fresh', 30.00, 35.00, '500g', 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=400&fit=crop', 15),
((SELECT id FROM categories WHERE slug = 'fruits-vegetables'), 'Green Onions', 'Fresh spring onions', 'Fresh', 25.00, 30.00, '250g', 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&h=400&fit=crop', 15),
((SELECT id FROM categories WHERE slug = 'fruits-vegetables'), 'Fresh Potatoes', 'Quality potatoes', 'Fresh', 20.00, 25.00, '1kg', 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&h=400&fit=crop', 15);

-- Insert Products for Personal Care
INSERT INTO products (category_id, name, description, brand, price, mrp, unit, image_url, delivery_time) VALUES
((SELECT id FROM categories WHERE slug = 'personal-care'), 'Colgate Toothpaste', 'Advanced whitening', 'Colgate', 85.00, 95.00, '100g', 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=400&h=400&fit=crop', 15),
((SELECT id FROM categories WHERE slug = 'personal-care'), 'Head & Shoulders Shampoo', 'Anti-dandruff shampoo', 'Head & Shoulders', 180.00, 200.00, '340ml', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop', 15),
((SELECT id FROM categories WHERE slug = 'personal-care'), 'Dettol Soap', 'Antibacterial soap', 'Dettol', 35.00, 40.00, '125g', 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400&h=400&fit=crop', 15),
((SELECT id FROM categories WHERE slug = 'personal-care'), 'Nivea Body Lotion', 'Moisturizing lotion', 'Nivea', 199.00, 220.00, '400ml', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop', 15),
((SELECT id FROM categories WHERE slug = 'personal-care'), 'Oral-B Toothbrush', 'Soft bristle toothbrush', 'Oral-B', 45.00, 50.00, '1 piece', 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=400&h=400&fit=crop', 15);

-- Insert Products for Fruits & Vegetables
INSERT INTO products (category_id, name, description, brand, price, mrp, unit, image_url, delivery_time) VALUES
((SELECT id FROM categories WHERE slug = 'fruits-vegetables'), 'Fresh Bananas', 'Ripe yellow bananas', 'Fresh', 40.00, 45.00, '1kg', 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=400&fit=crop', 15),
((SELECT id FROM categories WHERE slug = 'fruits-vegetables'), 'Red Apples', 'Crispy red apples', 'Fresh', 120.00, 130.00, '1kg', 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&h=400&fit=crop', 15),
((SELECT id FROM categories WHERE slug = 'fruits-vegetables'), 'Fresh Tomatoes', 'Red ripe tomatoes', 'Fresh', 30.00, 35.00, '500g', 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=400&fit=crop', 15),
((SELECT id FROM categories WHERE slug = 'fruits-vegetables'), 'Green Onions', 'Fresh spring onions', 'Fresh', 25.00, 30.00, '250g', 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&h=400&fit=crop', 15),
((SELECT id FROM categories WHERE slug = 'fruits-vegetables'), 'Fresh Potatoes', 'Quality potatoes', 'Fresh', 20.00, 25.00, '1kg', 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&h=400&fit=crop', 15);

-- Insert Sample Store
INSERT INTO stores (name, address, latitude, longitude, phone, email, delivery_radius_km, operating_hours) VALUES
('Blinkit Store - Central Delhi', 'Connaught Place, New Delhi, Delhi 110001', 28.6315, 77.2167, '+91-9876543210', 'store1@blinkit.com', 15.0, 
'{"monday": {"open": "06:00", "close": "23:00"}, "tuesday": {"open": "06:00", "close": "23:00"}, "wednesday": {"open": "06:00", "close": "23:00"}, "thursday": {"open": "06:00", "close": "23:00"}, "friday": {"open": "06:00", "close": "23:00"}, "saturday": {"open": "06:00", "close": "23:00"}, "sunday": {"open": "06:00", "close": "23:00"}}'),

('Blinkit Store - Gurgaon', 'Cyber City, Gurgaon, Haryana 122002', 28.4595, 77.0266, '+91-9876543211', 'store2@blinkit.com', 12.0,
'{"monday": {"open": "06:00", "close": "23:00"}, "tuesday": {"open": "06:00", "close": "23:00"}, "wednesday": {"open": "06:00", "close": "23:00"}, "thursday": {"open": "06:00", "close": "23:00"}, "friday": {"open": "06:00", "close": "23:00"}, "saturday": {"open": "06:00", "close": "23:00"}, "sunday": {"open": "06:00", "close": "23:00"}}'),

('Blinkit Store - Noida', 'Sector 18, Noida, Uttar Pradesh 201301', 28.5706, 77.3272, '+91-9876543212', 'store3@blinkit.com', 10.0,
'{"monday": {"open": "06:00", "close": "23:00"}, "tuesday": {"open": "06:00", "close": "23:00"}, "wednesday": {"open": "06:00", "close": "23:00"}, "thursday": {"open": "06:00", "close": "23:00"}, "friday": {"open": "06:00", "close": "23:00"}, "saturday": {"open": "06:00", "close": "23:00"}, "sunday": {"open": "06:00", "close": "23:00"}}');

-- Insert Inventory for all products across all stores
INSERT INTO inventory (store_id, product_id, quantity, reserved_quantity, reorder_level)
SELECT 
    s.id as store_id,
    p.id as product_id,
    CASE 
        WHEN RANDOM() < 0.1 THEN 0  -- 10% chance of out of stock
        WHEN RANDOM() < 0.2 THEN FLOOR(RANDOM() * 5) + 1  -- 10% chance of low stock (1-5)
        ELSE FLOOR(RANDOM() * 95) + 5  -- 80% chance of good stock (5-100)
    END as quantity,
    0 as reserved_quantity,
    CASE 
        WHEN p.name LIKE '%Milk%' OR p.name LIKE '%Bread%' OR p.name LIKE '%Eggs%' THEN 20
        WHEN p.name LIKE '%Coca Cola%' OR p.name LIKE '%Pepsi%' THEN 30
        ELSE 10
    END as reorder_level
FROM stores s
CROSS JOIN products p;

-- Update inventory quantities to be more realistic
UPDATE inventory SET quantity = 
    CASE 
        WHEN quantity = 0 THEN 0  -- Keep out of stock items
        WHEN quantity <= 5 THEN quantity  -- Keep low stock items
        ELSE FLOOR(RANDOM() * 50) + 20  -- Set good stock between 20-70
    END;

-- Add some reserved quantities for active orders simulation
UPDATE inventory 
SET reserved_quantity = FLOOR(RANDOM() * 3) + 1
WHERE quantity > 10 AND RANDOM() < 0.3;  -- 30% of well-stocked items have some reserved

-- Ensure reserved quantity doesn't exceed available quantity and is never negative
UPDATE inventory 
SET reserved_quantity = GREATEST(0, LEAST(reserved_quantity, quantity - 1))
WHERE reserved_quantity >= quantity OR reserved_quantity < 0;

-- Final safety check: Set reserved to 0 where it would make quantity unavailable
UPDATE inventory 
SET reserved_quantity = 0
WHERE quantity - reserved_quantity <= 0 OR reserved_quantity < 0;
