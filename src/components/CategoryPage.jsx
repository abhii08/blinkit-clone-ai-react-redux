import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllProductsByCategory } from '../../redux/slices/productsSlice';
import { addLocalItem, incrementLocalItem, decrementLocalItem } from '../../redux/slices/cartSlice';
import { addItemToCart, updateCartItemQuantity } from '../../redux/slices/cartSlice';
import SimpleQuantitySelector from './SimpleQuantitySelector';

const CategoryPage = () => {
  const { categorySlug } = useParams();
  const dispatch = useDispatch();
  
  const { allProductsByCategory, loading, error } = useSelector(state => state.products);
  const { user } = useSelector(state => state.auth);
  const { items: cartItems, localItems } = useSelector(state => state.cart);
  
  const products = allProductsByCategory[categorySlug] || [];
  const isLoading = loading.allProductsByCategory;
  const errorMessage = error.allProductsByCategory;

  // Category name mapping
  const categoryNames = {
    'dairy-bread-eggs': 'Dairy, Bread & Eggs',
    'fruits-vegetables': 'Fruits & Vegetables',
    'cold-drinks-juices': 'Cold Drinks & Juices',
    'snacks-munchies': 'Snacks & Munchies',
    'sweet-tooth': 'Sweet Tooth',
    'breakfast-instant-food': 'Breakfast & Instant Food'
  };

  const categoryName = categoryNames[categorySlug] || categorySlug;

  useEffect(() => {
    if (categorySlug) {
      dispatch(fetchAllProductsByCategory({ categorySlug }));
    }
  }, [categorySlug, dispatch]);

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
          image: product.image_url,
          quantity: product.unit
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <p className="text-red-600">Error loading products: {errorMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{categoryName}</h1>
          <p className="text-gray-600">{products.length} products available</p>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No products found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {products.map((product) => {
              const quantity = getProductQuantity(product.id);
              
              return (
                <div
                  key={product.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200"
                >
                  {/* Product Image */}
                  <div className="aspect-square mb-3 rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=200&h=200&fit=crop';
                      }}
                    />
                  </div>

                  {/* Delivery Time */}
                  <div className="flex items-center text-xs text-gray-500 mb-2">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {product.delivery_time} MINS
                  </div>

                  {/* Product Name */}
                  <h3 className="font-medium text-sm text-gray-900 mb-1 line-clamp-2">
                    {product.name}
                  </h3>

                  {/* Unit */}
                  <p className="text-xs text-gray-500 mb-2">{product.unit}</p>

                  {/* Price and Add Button Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <span className="font-semibold text-gray-900">₹{product.price}</span>
                      {product.mrp && product.mrp > product.price && (
                        <span className="text-xs text-gray-500 line-through">₹{product.mrp}</span>
                      )}
                    </div>
                    
                    {quantity === 0 ? (
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="bg-white border border-green-600 text-green-600 py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-50 transition-colors duration-200 w-[60px]"
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
        )}
      </div>
    </div>
  );
};

export default CategoryPage;
