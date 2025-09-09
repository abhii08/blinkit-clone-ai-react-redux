import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategories, fetchProductsByCategory } from '../../redux/slices/productsSlice';
import { addLocalItem, incrementLocalItem, decrementLocalItem } from '../../redux/slices/cartSlice';
import { addItemToCart, updateCartItemQuantity } from '../../redux/slices/cartSlice';
import SimpleQuantitySelector from './SimpleQuantitySelector';

const CategoryGrid = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { categories, productsByCategory, loading, error } = useSelector(state => state.products);
  const { user } = useSelector(state => state.auth);
  const { items: cartItems, localItems } = useSelector(state => state.cart);

  useEffect(() => {
    dispatch(fetchCategories());
    // Fetch some products for each category to display
    const mainCategories = ['dairy-bread-eggs', 'sweet-tooth', 'snacks-munchies', 'cold-drinks-juices'];
    mainCategories.forEach(categorySlug => {
      dispatch(fetchProductsByCategory({ categorySlug, limit: 4 }));
    });
  }, [dispatch]);

  const handleCategoryClick = (category) => {
    navigate(`/category/${category.slug}`);
  };

  // Get quantity for a product from cart
  const getProductQuantity = (productId) => {
    if (user) {
      const cartItem = cartItems.find(item => item.product_id === productId);
      return cartItem ? cartItem.quantity : 0;
    } else {
      const localItem = localItems.find(item => item.product_id === productId);
      return localItem ? localItem.quantity : 0;
    }
  };

  // Handle add to cart
  const handleAddToCart = (product) => {
    if (user) {
      dispatch(addItemToCart({
        userId: user.id,
        productId: product.id,
        quantity: 1
      }));
    } else {
      dispatch(addLocalItem({
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: product.quantity
        },
        quantity: 1
      }));
    }
  };

  // Handle quantity change
  const handleQuantityChange = (product, newQuantity) => {
    if (user) {
      dispatch(updateCartItemQuantity({
        userId: user.id,
        productId: product.id,
        quantity: newQuantity
      }));
    } else {
      if (newQuantity > getProductQuantity(product.id)) {
        dispatch(incrementLocalItem({ productId: product.id }));
      } else {
        dispatch(decrementLocalItem({ productId: product.id }));
      }
    }
  };

  if (loading.categories) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  if (error.categories) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center">
          <p className="text-red-600">Error loading categories: {error.categories}</p>
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
        {Object.entries(productsByCategory).map(([categorySlug, products]) => {
          if (!products || products.length === 0) return null;
          
          const categoryName = categories.find(cat => cat.slug === categorySlug)?.name || categorySlug;
          
          return (
            <div key={categorySlug} className="bg-white">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">{categoryName}</h2>
                <button
                  onClick={() => navigate(`/category/${categorySlug}`)}
                  className="text-green-600 hover:text-green-700 font-medium text-sm"
                >
                  See all
                </button>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {products.map((product) => {
                  const quantity = getProductQuantity(product.id);
                  
                  return (
                    <div
                      key={product.id}
                      className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow duration-200"
                    >
                      {/* Product Image */}
                      <div className="aspect-square mb-2 rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=200&h=200&fit=crop';
                          }}
                        />
                      </div>

                      {/* Delivery Time */}
                      <div className="flex items-center text-xs text-gray-500 mb-1">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {product.time}
                      </div>

                      {/* Product Name */}
                      <h3 className="font-medium text-sm text-gray-900 mb-1 line-clamp-2">
                        {product.name}
                      </h3>

                      {/* Unit */}
                      <p className="text-xs text-gray-500 mb-2">{product.quantity}</p>

                      {/* Price and Add Button Row */}
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900">₹{product.price}</span>
                        
                        {quantity === 0 ? (
                          <button
                            onClick={() => handleAddToCart(product)}
                            className="bg-white border border-green-600 text-green-600 py-1.5 px-3 rounded-lg text-sm font-medium hover:bg-green-50 transition-colors duration-200 w-[60px]"
                          >
                            ADD
                          </button>
                        ) : (
                          <SimpleQuantitySelector
                            quantity={quantity}
                            onIncrement={() => handleQuantityChange(product, quantity + 1)}
                            onDecrement={() => handleQuantityChange(product, quantity - 1)}
                            size="sm"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryGrid;
