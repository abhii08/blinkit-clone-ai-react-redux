-- Optimize homepage performance by creating a function to fetch all data in one query
-- This reduces multiple API calls to a single optimized query

-- Create function to get homepage data (categories with featured products)
CREATE OR REPLACE FUNCTION get_homepage_data()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'categories', categories_data.categories,
        'featured_products', products_data.products
    ) INTO result
    FROM (
        -- Get categories
        SELECT json_agg(
            json_build_object(
                'id', c.id,
                'name', c.name,
                'slug', c.slug,
                'description', c.description,
                'image_url', c.image_url,
                'sort_order', c.sort_order
            ) ORDER BY c.sort_order
        ) as categories
        FROM categories c
        WHERE c.is_active = true
        LIMIT 6
    ) categories_data,
    (
        -- Get featured products for each category (4 per category)
        SELECT json_agg(
            json_build_object(
                'category_slug', category_products.category_slug,
                'products', category_products.products
            ) ORDER BY category_products.sort_order
        ) as products
        FROM (
            SELECT 
                cat.slug as category_slug,
                cat.sort_order,
                json_agg(
                    json_build_object(
                        'id', p.id,
                        'name', p.name,
                        'price', p.price,
                        'unit', p.unit,
                        'image_url', p.image_url,
                        'delivery_time', p.delivery_time,
                        'mrp', p.mrp
                    ) ORDER BY p.created_at DESC
                ) as products
            FROM categories cat
            INNER JOIN products p ON p.category_id = cat.id
            WHERE cat.is_active = true 
                AND p.is_active = true
                AND cat.id IN (
                    SELECT id FROM categories 
                    WHERE is_active = true 
                    ORDER BY sort_order 
                    LIMIT 6
                )
            GROUP BY cat.id, cat.slug, cat.sort_order
            ORDER BY cat.sort_order
        ) category_products
    ) products_data;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create index for better performance if not exists
CREATE INDEX IF NOT EXISTS idx_products_category_active ON products(category_id, is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_categories_active_sort ON categories(is_active, sort_order);

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_homepage_data() TO anon, authenticated;

COMMENT ON FUNCTION get_homepage_data() IS 'Optimized function to fetch all homepage data (categories and featured products) in a single query';
