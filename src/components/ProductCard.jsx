import React, { memo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addItemToCart, updateCartItemQuantity } from '../../redux/slices/cartSlice';
import { openAuthModal, setPendingAction } from '../../redux/slices/uiSlice';
import SimpleQuantitySelector from './SimpleQuantitySelector';

const ProductCard = memo(({ product, categorySlug }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { items: cartItems, localItems } = useSelector(state => state.cart);

  // Get quantity for this product from cart
  const getProductQuantity = useCallback(() => {
    if (user) {
      const cartItem = cartItems.find(item => item.product_id === product.id);
      return cartItem ? cartItem.quantity : 0;
    } else {
      const localItem = localItems.find(item => item.product_id === product.id);
      return localItem ? localItem.quantity : 0;
    }
  }, [user, cartItems, localItems, product.id]);

  const quantity = getProductQuantity();

  // Handle add to cart
  const handleAddToCart = useCallback(() => {
    if (!user) {
      // Store the pending action
      dispatch(setPendingAction({
        type: 'ADD_TO_CART',
        product,
        quantity: 1
      }));
      
      // Open login modal
      dispatch(openAuthModal('login'));
      return;
    }

    dispatch(addItemToCart({
      userId: user.id,
      productId: product.id,
      quantity: 1
    }));
  }, [user, product, dispatch]);

  // Handle quantity change
  const handleQuantityChange = useCallback((newQuantity) => {
    if (!user) {
      // Store the pending action
      dispatch(setPendingAction({
        type: 'UPDATE_CART',
        product,
        quantity: newQuantity
      }));
      
      // Open login modal
      dispatch(openAuthModal('login'));
      return;
    }

    dispatch(updateCartItemQuantity({
      userId: user.id,
      productId: product.id,
      quantity: newQuantity
    }));
  }, [user, product, dispatch]);

  const handleIncrement = useCallback(() => {
    handleQuantityChange(quantity + 1);
  }, [handleQuantityChange, quantity]);

  const handleDecrement = useCallback(() => {
    handleQuantityChange(quantity - 1);
  }, [handleQuantityChange, quantity]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200">
      {/* Product Image */}
      <div className="aspect-square mb-3 rounded-lg overflow-hidden bg-gray-100">
        <img
          src={product.image || product.image_url}
          alt={product.name}
          className="w-full h-full object-cover"
          loading="lazy"
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
        {product.time || `${product.delivery_time} MINS`}
      </div>

      {/* Product Name */}
      <h3 className="font-medium text-sm text-gray-900 mb-1 line-clamp-2">
        {product.name}
      </h3>

      {/* Unit */}
      <p className="text-xs text-gray-500 mb-2">{product.quantity || product.unit}</p>

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
            onClick={handleAddToCart}
            className="bg-white border border-green-600 text-green-600 py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-50 transition-colors duration-200 w-[60px]"
          >
            ADD
          </button>
        ) : (
          <SimpleQuantitySelector
            quantity={quantity}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
            size="sm"
          />
        )}
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
