-- Fresh Seed Data for Blinkit Clone
-- Run this AFTER fresh-schema.sql in your NEW Supabase project

-- Clear existing data (in reverse order due to foreign key constraints)
DELETE FROM inventory;
DELETE FROM cart_items;
DELETE FROM products;
DELETE FROM stores;
DELETE FROM categories;

-- Insert categories
INSERT INTO categories (name, slug, description, image_url, sort_order) VALUES
('Dairy, Bread & Eggs', 'dairy-bread-eggs', 'Fresh dairy products, bread and eggs', 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=200&h=200&fit=crop', 1),
('Fruits & Vegetables', 'fruits-vegetables', 'Fresh fruits and vegetables', 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&h=200&fit=crop', 2),
('Cold Drinks & Juices', 'cold-drinks-juices', 'Beverages, soft drinks and juices', 'https://images.unsplash.com/photo-1437418747212-8d9709afab22?w=200&h=200&fit=crop', 3),
('Snacks & Munchies', 'snacks-munchies', 'Chips, namkeen, biscuits and snacks', 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=200&h=200&fit=crop', 4),
('Sweet Tooth', 'sweet-tooth', 'Chocolates, candies and sweets', 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=200&h=200&fit=crop', 5),
('Breakfast & Instant Food', 'breakfast-instant-food', 'Cereals, instant noodles and breakfast items', 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=200&h=200&fit=crop', 6);

-- Insert stores
INSERT INTO stores (name, address, latitude, longitude, phone, email, delivery_radius, operating_hours) VALUES
('Blinkit Central Store', 'Main Street, City Center, 123456', 23.0225, 72.5714, '+91-1234567890', 'central@blinkit.com', 15, '{"monday": {"open": "06:00", "close": "23:00"}, "tuesday": {"open": "06:00", "close": "23:00"}, "wednesday": {"open": "06:00", "close": "23:00"}, "thursday": {"open": "06:00", "close": "23:00"}, "friday": {"open": "06:00", "close": "23:00"}, "saturday": {"open": "06:00", "close": "23:00"}, "sunday": {"open": "06:00", "close": "23:00"}}'),
('Blinkit Express Store', 'Shopping Mall, Express Lane, 123457', 23.0395, 72.5066, '+91-9876543210', 'express@blinkit.com', 12, '{"monday": {"open": "06:00", "close": "23:00"}, "tuesday": {"open": "06:00", "close": "23:00"}, "wednesday": {"open": "06:00", "close": "23:00"}, "thursday": {"open": "06:00", "close": "23:00"}, "friday": {"open": "06:00", "close": "23:00"}, "saturday": {"open": "06:00", "close": "23:00"}, "sunday": {"open": "06:00", "close": "23:00"}}');

-- Insert products for Dairy, Bread & Eggs
INSERT INTO products (name, slug, description, category_id, brand, price, mrp, unit, image_url, delivery_time, tags) VALUES
('Amul Taaza Toned Milk', 'amul-taaza-toned-milk', 'Fresh toned milk from Amul', (SELECT id FROM categories WHERE slug = 'dairy-bread-eggs'), 'Amul', 27, 27, '500 ml', 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=200&h=200&fit=crop', 18, ARRAY['milk', 'dairy', 'amul']),
('Amul Gold Full Cream Milk', 'amul-gold-full-cream-milk', 'Rich full cream milk from Amul', (SELECT id FROM categories WHERE slug = 'dairy-bread-eggs'), 'Amul', 34, 34, '500 ml', 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&h=200&fit=crop', 18, ARRAY['milk', 'dairy', 'amul']),
('Fresh White Bread', 'fresh-white-bread', 'Soft white bread', (SELECT id FROM categories WHERE slug = 'dairy-bread-eggs'), 'Harvest Gold', 25, 25, '400 g', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=200&h=200&fit=crop', 15, ARRAY['bread', 'white']),
('Brown Bread', 'brown-bread', 'Healthy brown bread', (SELECT id FROM categories WHERE slug = 'dairy-bread-eggs'), 'Harvest Gold', 35, 35, '400 g', 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=200&h=200&fit=crop', 15, ARRAY['bread', 'brown', 'healthy']),
('Farm Fresh Eggs', 'farm-fresh-eggs', 'Fresh farm eggs', (SELECT id FROM categories WHERE slug = 'dairy-bread-eggs'), 'Farm Fresh', 60, 65, '6 pieces', 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=200&h=200&fit=crop', 20, ARRAY['eggs', 'fresh']),
('Amul Butter', 'amul-butter', 'Premium salted butter', (SELECT id FROM categories WHERE slug = 'dairy-bread-eggs'), 'Amul', 55, 55, '100 g', 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=200&h=200&fit=crop', 18, ARRAY['butter', 'dairy', 'amul']);

-- Insert products for Fruits & Vegetables
INSERT INTO products (name, slug, description, category_id, brand, price, mrp, unit, image_url, delivery_time, tags) VALUES
('Fresh Bananas', 'fresh-bananas', 'Fresh ripe bananas', (SELECT id FROM categories WHERE slug = 'fruits-vegetables'), 'Fresh', 40, 45, '1 kg', 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=200&h=200&fit=crop', 15, ARRAY['banana', 'fruit', 'fresh']),
('Red Apples', 'red-apples', 'Fresh red apples', (SELECT id FROM categories WHERE slug = 'fruits-vegetables'), 'Fresh', 120, 130, '1 kg', 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=200&h=200&fit=crop', 15, ARRAY['apple', 'fruit', 'red']),
('Fresh Tomatoes', 'fresh-tomatoes', 'Fresh ripe tomatoes', (SELECT id FROM categories WHERE slug = 'fruits-vegetables'), 'Fresh', 30, 35, '500 g', 'https://images.unsplash.com/photo-1546470427-e26264be0b0d?w=200&h=200&fit=crop', 15, ARRAY['tomato', 'vegetable']),
('Green Capsicum', 'green-capsicum', 'Fresh green bell peppers', (SELECT id FROM categories WHERE slug = 'fruits-vegetables'), 'Fresh', 60, 65, '500 g', 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=200&h=200&fit=crop', 15, ARRAY['capsicum', 'vegetable']),
('Fresh Onions', 'fresh-onions', 'Fresh red onions', (SELECT id FROM categories WHERE slug = 'fruits-vegetables'), 'Fresh', 25, 30, '1 kg', 'https://images.unsplash.com/photo-1508747703725-719777637510?w=200&h=200&fit=crop', 15, ARRAY['onion', 'vegetable']),
('Fresh Potatoes', 'fresh-potatoes', 'Fresh potatoes', (SELECT id FROM categories WHERE slug = 'fruits-vegetables'), 'Fresh', 20, 25, '1 kg', 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=200&h=200&fit=crop', 15, ARRAY['potato', 'vegetable']);

-- Insert products for Cold Drinks & Juices
INSERT INTO products (name, slug, description, category_id, brand, price, mrp, unit, image_url, delivery_time, tags) VALUES
('Coca Cola', 'coca-cola', 'Classic Coca Cola', (SELECT id FROM categories WHERE slug = 'cold-drinks-juices'), 'Coca Cola', 40, 40, '600 ml', 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=200&h=200&fit=crop', 10, ARRAY['cola', 'soft-drink']),
('Pepsi', 'pepsi', 'Pepsi cola drink', (SELECT id FROM categories WHERE slug = 'cold-drinks-juices'), 'Pepsi', 40, 40, '600 ml', 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=200&h=200&fit=crop', 10, ARRAY['cola', 'soft-drink']),
('Fresh Orange Juice', 'fresh-orange-juice', 'Freshly squeezed orange juice', (SELECT id FROM categories WHERE slug = 'cold-drinks-juices'), 'Real', 60, 65, '1 L', 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=200&h=200&fit=crop', 12, ARRAY['juice', 'orange', 'fresh']),
('Mango Juice', 'mango-juice', 'Sweet mango juice', (SELECT id FROM categories WHERE slug = 'cold-drinks-juices'), 'Real', 55, 60, '1 L', 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=200&h=200&fit=crop', 12, ARRAY['juice', 'mango']),
('Mineral Water', 'mineral-water', 'Pure mineral water', (SELECT id FROM categories WHERE slug = 'cold-drinks-juices'), 'Bisleri', 20, 20, '1 L', 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=200&h=200&fit=crop', 8, ARRAY['water', 'mineral']),
('Sprite', 'sprite', 'Lemon lime soda', (SELECT id FROM categories WHERE slug = 'cold-drinks-juices'), 'Sprite', 40, 40, '600 ml', 'https://images.unsplash.com/photo-1625772452859-1c03d5bf1137?w=200&h=200&fit=crop', 10, ARRAY['soda', 'lemon']);

-- Insert products for Snacks & Munchies
INSERT INTO products (name, slug, description, category_id, brand, price, mrp, unit, image_url, delivery_time, tags) VALUES
('Lays Classic', 'lays-classic', 'Classic salted potato chips', (SELECT id FROM categories WHERE slug = 'snacks-munchies'), 'Lays', 20, 20, '52 g', 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=200&h=200&fit=crop', 12, ARRAY['chips', 'potato', 'snack']),
('Kurkure Masala Munch', 'kurkure-masala-munch', 'Spicy corn snack', (SELECT id FROM categories WHERE slug = 'snacks-munchies'), 'Kurkure', 10, 10, '20 g', 'https://images.unsplash.com/photo-1613919113640-25732ec5e61f?w=200&h=200&fit=crop', 12, ARRAY['kurkure', 'spicy', 'snack']),
('Parle-G Biscuits', 'parle-g-biscuits', 'Classic glucose biscuits', (SELECT id FROM categories WHERE slug = 'snacks-munchies'), 'Parle', 15, 15, '200 g', 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200&h=200&fit=crop', 15, ARRAY['biscuits', 'glucose']),
('Britannia Good Day', 'britannia-good-day', 'Butter cookies', (SELECT id FROM categories WHERE slug = 'snacks-munchies'), 'Britannia', 25, 25, '150 g', 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=200&h=200&fit=crop', 15, ARRAY['cookies', 'butter']),
('Haldirams Namkeen', 'haldirams-namkeen', 'Mixed namkeen', (SELECT id FROM categories WHERE slug = 'snacks-munchies'), 'Haldirams', 45, 50, '200 g', 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=200&h=200&fit=crop', 18, ARRAY['namkeen', 'spicy']),
('Maggi Noodles', 'maggi-noodles', '2-minute instant noodles', (SELECT id FROM categories WHERE slug = 'snacks-munchies'), 'Maggi', 12, 12, '70 g', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200&h=200&fit=crop', 10, ARRAY['noodles', 'instant']);

-- Insert products for Sweet Tooth
INSERT INTO products (name, slug, description, category_id, brand, price, mrp, unit, image_url, delivery_time, tags) VALUES
('Dairy Milk Chocolate', 'dairy-milk-chocolate', 'Creamy milk chocolate', (SELECT id FROM categories WHERE slug = 'sweet-tooth'), 'Cadbury', 35, 35, '55 g', 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=200&h=200&fit=crop', 12, ARRAY['chocolate', 'milk']),
('KitKat', 'kitkat', 'Crispy wafer chocolate', (SELECT id FROM categories WHERE slug = 'sweet-tooth'), 'Nestle', 20, 20, '37.3 g', 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=200&h=200&fit=crop', 12, ARRAY['chocolate', 'wafer']),
('Ferrero Rocher', 'ferrero-rocher', 'Premium hazelnut chocolate', (SELECT id FROM categories WHERE slug = 'sweet-tooth'), 'Ferrero', 150, 160, '3 pieces', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=200&fit=crop', 15, ARRAY['chocolate', 'premium', 'hazelnut']),
('Mentos', 'mentos', 'Fresh mint candy', (SELECT id FROM categories WHERE slug = 'sweet-tooth'), 'Mentos', 10, 10, '37.5 g', 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=200&h=200&fit=crop', 10, ARRAY['candy', 'mint']),
('Orbit Gum', 'orbit-gum', 'Sugar-free chewing gum', (SELECT id FROM categories WHERE slug = 'sweet-tooth'), 'Orbit', 15, 15, '14 g', 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=200&h=200&fit=crop', 10, ARRAY['gum', 'sugar-free']),
('Gulab Jamun', 'gulab-jamun', 'Traditional Indian sweet', (SELECT id FROM categories WHERE slug = 'sweet-tooth'), 'Haldirams', 80, 85, '500 g', 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=200&h=200&fit=crop', 20, ARRAY['sweet', 'indian', 'traditional']);

-- Insert products for Breakfast & Instant Food
INSERT INTO products (name, slug, description, category_id, brand, price, mrp, unit, image_url, delivery_time, tags) VALUES
('Kelloggs Corn Flakes', 'kelloggs-corn-flakes', 'Crispy corn flakes cereal', (SELECT id FROM categories WHERE slug = 'breakfast-instant-food'), 'Kelloggs', 180, 190, '475 g', 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=200&h=200&fit=crop', 15, ARRAY['cereal', 'corn-flakes']),
('Quaker Oats', 'quaker-oats', 'Healthy rolled oats', (SELECT id FROM categories WHERE slug = 'breakfast-instant-food'), 'Quaker', 120, 130, '500 g', 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=200&h=200&fit=crop', 15, ARRAY['oats', 'healthy']),
('Top Ramen Noodles', 'top-ramen-noodles', 'Instant ramen noodles', (SELECT id FROM categories WHERE slug = 'breakfast-instant-food'), 'Top Ramen', 12, 12, '70 g', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200&h=200&fit=crop', 10, ARRAY['noodles', 'instant', 'ramen']),
('Yippee Noodles', 'yippee-noodles', 'Masala instant noodles', (SELECT id FROM categories WHERE slug = 'breakfast-instant-food'), 'Yippee', 12, 12, '65 g', 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=200&h=200&fit=crop', 10, ARRAY['noodles', 'masala']),
('MTR Ready to Eat', 'mtr-ready-to-eat', 'Ready to eat dal fry', (SELECT id FROM categories WHERE slug = 'breakfast-instant-food'), 'MTR', 45, 50, '300 g', 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=200&h=200&fit=crop', 12, ARRAY['ready-to-eat', 'dal']),
('Poha Mix', 'poha-mix', 'Instant poha breakfast mix', (SELECT id FROM categories WHERE slug = 'breakfast-instant-food'), 'Haldirams', 35, 40, '200 g', 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=200&h=200&fit=crop', 15, ARRAY['poha', 'breakfast', 'instant']);

-- Insert inventory for all products at both stores
INSERT INTO inventory (product_id, store_id, quantity, reserved_quantity, reorder_level)
SELECT 
    p.id as product_id,
    s.id as store_id,
    FLOOR(RANDOM() * 80) + 20 as quantity, -- Random quantity between 20-100
    0 as reserved_quantity,
    CASE 
        WHEN p.name ILIKE '%milk%' OR p.name ILIKE '%bread%' OR p.name ILIKE '%egg%' THEN 10
        WHEN p.name ILIKE '%fruit%' OR p.name ILIKE '%vegetable%' THEN 5
        ELSE 3
    END as reorder_level
FROM products p
CROSS JOIN stores s
WHERE p.is_active = true AND s.is_active = true;
