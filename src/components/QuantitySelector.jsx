import { useState } from 'react';
import { useCart, useAuth, useUI } from '../../redux/hooks';
import { addLocalItem, updateLocalItem, removeLocalItem } from '../../redux/slices/cartSlice';
import { openAuthModal, setPendingAction } from '../../redux/slices/uiSlice';

const QuantitySelector = ({ product, className = "" }) => {
  const { items: cartItems, localItems, dispatch: cartDispatch } = useCart();
  const { user } = useAuth();
  const { dispatch: uiDispatch } = useUI();
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Get current quantity from cart (check both authenticated and local cart)
  const allItems = [...cartItems, ...localItems];
  const cartItem = allItems.find(item => item.product_id === product.id);
  const currentQuantity = cartItem?.quantity || 0;

  const handleAdd = () => {
    // Check if user is authenticated
    if (!user) {
      // Store the pending action
      uiDispatch(setPendingAction({
        type: 'ADD_TO_CART',
        product,
        quantity: currentQuantity === 0 ? 1 : currentQuantity + 1
      }));
      
      // Open login modal
      uiDispatch(openAuthModal('login'));
      return;
    }
    
    setIsAnimating(true);
    
    if (currentQuantity === 0) {
      cartDispatch(addLocalItem({
        product,
        quantity: 1
      }));
    } else {
      cartDispatch(updateLocalItem({
        productId: product.id,
        quantity: currentQuantity + 1
      }));
    }
    
    setTimeout(() => setIsAnimating(false), 200);
  };

  const handleRemove = () => {
    // Check if user is authenticated
    if (!user) {
      // Store the pending action
      uiDispatch(setPendingAction({
        type: 'UPDATE_CART',
        product,
        quantity: currentQuantity - 1
      }));
      
      // Open login modal
      uiDispatch(openAuthModal('login'));
      return;
    }
    
    setIsAnimating(true);
    
    if (currentQuantity === 1) {
      cartDispatch(removeLocalItem({
        productId: product.id
      }));
    } else {
      cartDispatch(updateLocalItem({
        productId: product.id,
        quantity: currentQuantity - 1
      }));
    }
    
    setTimeout(() => setIsAnimating(false), 200);
  };

  // Show ADD button when quantity is 0
  if (currentQuantity === 0) {
    return (
      <button 
        onClick={handleAdd}
        disabled={isAnimating}
        className={`bg-white border border-green-600 text-green-600 px-3 py-1 rounded text-sm font-semibold hover:bg-green-50 transition-all duration-200 transform ${
          isAnimating ? 'scale-95' : 'hover:scale-105'
        } disabled:opacity-70 ${className}`}
      >
        ADD
      </button>
    );
  }

  // Show quantity selector when quantity > 0
  return (
    <div className={`flex items-center bg-green-600 rounded overflow-hidden transition-all duration-300 transform ${
      isAnimating ? 'scale-95' : ''
    } ${className}`}>
      {/* Decrement Button */}
      <button
        onClick={handleRemove}
        disabled={isAnimating}
        className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 text-lg font-bold transition-colors duration-200 disabled:opacity-70 flex items-center justify-center min-w-[28px]"
      >
        −
      </button>
      
      {/* Quantity Display */}
      <div className="bg-green-600 text-white px-3 py-1 text-sm font-semibold min-w-[32px] text-center flex items-center justify-center">
        <span className={`transition-all duration-200 ${isAnimating ? 'scale-110' : ''}`}>
          {currentQuantity}
        </span>
      </div>
      
      {/* Increment Button */}
      <button
        onClick={handleAdd}
        disabled={isAnimating}
        className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 text-lg font-bold transition-colors duration-200 disabled:opacity-70 flex items-center justify-center min-w-[28px]"
      >
        +
      </button>
    </div>
  );
};

export default QuantitySelector;
