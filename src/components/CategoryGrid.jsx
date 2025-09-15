import { useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchHomepageData, fetchCategories, fetchProductsByCategory } from '../../redux/slices/productsSlice';
import ProductCard from './ProductCard';

const CategoryGrid = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { categories, productsByCategory, homepageData, loading, error } = useSelector(state => state.products);

  useEffect(() => {
    // Try optimized homepage data fetch first
    dispatch(fetchHomepageData());
  }, [dispatch]);

  // Fallback: If homepage data fails, use the old method
  useEffect(() => {
    if (error.homepage && !loading.homepage && categories.length === 0) {
      console.log('Homepage data fetch failed, falling back to separate queries');
      dispatch(fetchCategories());
    }
  }, [error.homepage, loading.homepage, categories.length, dispatch]);

  // Fallback: Fetch products for categories if using old method
  useEffect(() => {
    if (!homepageData && categories.length > 0 && !loading.homepage) {
      const categoriesToShow = categories.slice(0, 6);
      categoriesToShow.forEach(category => {
        if (!productsByCategory[category.slug]) {
          dispatch(fetchProductsByCategory({ categorySlug: category.slug, limit: 4 }));
        }
      });
    }
  }, [homepageData, categories, productsByCategory, loading.homepage, dispatch]);

  const handleCategoryClick = (category) => {
    navigate(`/category/${category.slug}`);
  };

  // Show loading state for homepage data or fallback categories
  if (loading.homepage || (loading.categories && !homepageData)) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  // Show error only if both homepage and fallback methods failed
  if (error.homepage && error.categories && !homepageData && categories.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center">
          <p className="text-red-600">Error loading categories. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Categories Grid */}
      <div className="grid grid-cols-5 md:grid-cols-10 gap-4 mb-8">
        {categories.map((category) => (
          <div
            key={category.id}
            onClick={() => handleCategoryClick(category)}
            className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer group"
          >
            <div className="w-16 h-16 md:w-20 md:h-20 mb-3 rounded-lg overflow-hidden group-hover:scale-105 transition-transform duration-200">
              <img
                src={category.image_url}
                alt={category.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=100&h=100&fit=crop';
                }}
              />
            </div>
            <p className="text-xs md:text-sm font-medium text-gray-800 text-center leading-tight">
              {category.name}
            </p>
          </div>
        ))}
      </div>

      {/* Featured Products Section */}
      <div className="space-y-8">
        {categories.slice(0, 6).map((category) => {
          const products = productsByCategory[category.slug] || [];
          
          return (
            <div key={category.slug} className="bg-white">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">{category.name}</h2>
                <button
                  onClick={() => navigate(`/category/${category.slug}`)}
                  className="text-green-600 hover:text-green-700 font-medium text-sm"
                >
                  See all
                </button>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {products.length === 0 ? (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    <p>Loading products...</p>
                  </div>
                ) : (
                  products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      categorySlug={category.slug}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default memo(CategoryGrid);
