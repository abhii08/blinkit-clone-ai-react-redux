-- Test the homepage function to see if it's working correctly
SELECT get_homepage_data();

-- Alternative: Test if the function exists
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'get_homepage_data';

-- Check if we have data in the tables
SELECT 'categories' as table_name, count(*) as count FROM categories WHERE is_active = true
UNION ALL
SELECT 'products' as table_name, count(*) as count FROM products WHERE is_active = true;

-- Test a simpler version to debug
SELECT 
    json_build_object(
        'categories', (
            SELECT json_agg(
                json_build_object(
                    'id', c.id,
                    'name', c.name,
                    'slug', c.slug,
                    'image_url', c.image_url
                )
            )
            FROM categories c
            WHERE c.is_active = true
            ORDER BY c.sort_order
            LIMIT 6
        ),
        'test', 'data'
    ) as simple_test;
