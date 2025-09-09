import { useState, useMemo, useCallback, useEffect } from 'react';
import { useCart, useAuth } from '../../redux/hooks/index.js';
import { updateCartItemQuantity, removeItemFromCart, addItemToCart, closeCart, incrementLocalItem, decrementLocalItem, removeLocalItem } from '../../redux/slices/cartSlice';
import { db } from '../lib/supabase';

const CartSidebar = () => {
  const { items: cartItems, localItems, totalAmount, totalItems, loading, isOpen, dispatch } = useCart();
  const { user } = useAuth();
  const [processingItems, setProcessingItems] = useState(new Set());
  const [stockInfo, setStockInfo] = useState(new Map());
  const [isDonationSelected, setIsDonationSelected] = useState(false);
  
  // Combine authenticated and local cart items with proper data structure
  const allItems = useMemo(() => {
    const combined = [...cartItems, ...localItems];
    return combined.map(item => {
      const productData = item.products || item.product || {};
      return {
        id: item.product_id || item.id,
        product_id: item.product_id || item.id,
        quantity: Number(item.quantity) || 0,
        product: {
          ...productData,
          name: productData.name || 'Product Name',
          image_url: productData.image_url || productData.image,
          unit: productData.unit || '500 ml',
          price: Number(productData.price) || 0
        },
        unitPrice: Number(productData.price || item.price || 0)
      };
    }).filter(item => item.quantity > 0); // Only show items with quantity > 0
  }, [cartItems, localItems]);

  const deliveryCharge = 30;
  const handlingCharge = 9;
  
  const handleClose = () => {
    dispatch(closeCart());
  };

  // Memoized totals calculation with real-time updates
  const { itemsTotal, grandTotal, actualDeliveryCharge } = useMemo(() => {
    const items = allItems.reduce((total, item) => {
      return total + (item.unitPrice * item.quantity);
    }, 0);
    const delivery = items >= 199 ? 0 : Number(deliveryCharge) || 0;
    const handling = Number(handlingCharge) || 0;
    const donation = isDonationSelected ? 1 : 0;
    const grand = items + delivery + handling + donation;
    return {
      itemsTotal: items,
      grandTotal: grand,
      actualDeliveryCharge: delivery
    };
  }, [allItems, deliveryCharge, handlingCharge, isDonationSelected]);

  // Fetch stock information for all cart items
  useEffect(() => {
    const fetchStockInfo = async () => {
      if (allItems.length === 0) return;
      
      const stockPromises = allItems.map(async (item) => {
        try {
          const stock = await db.getProductStock(item.product_id);
          return [item.product_id, stock];
        } catch (error) {
          console.error(`Error fetching stock for product ${item.product_id}:`, error);
          return [item.product_id, { available: 999, total: 999 }];
        }
      });
      
      const stockResults = await Promise.all(stockPromises);
      const stockMap = new Map(stockResults);
      setStockInfo(stockMap);
    };
    
    fetchStockInfo();
  }, [allItems]);

  // Currency formatter for INR
  const formatCurrency = useCallback((amount) => {
    const numAmount = Number(amount) || 0;
    return `₹${numAmount.toFixed(2)}`;
  }, []);

  // Set processing state for specific item
  const setItemProcessing = useCallback((productId, isProcessing) => {
    setProcessingItems(prev => {
      const newSet = new Set(prev);
      if (isProcessing) {
        newSet.add(productId);
      } else {
        newSet.delete(productId);
      }
      return newSet;
    });
  }, []);

  const handleIncrement = useCallback(async (productId) => {
    if (processingItems.has(productId)) return;
    
    // Check stock availability
    const currentItem = allItems.find(item => item.product_id === productId);
    const stock = stockInfo.get(productId);
    
    if (stock && currentItem && currentItem.quantity >= stock.available) {
      // Show stock limit message (you could replace this with a toast notification)
      alert(`Only ${stock.available} items available in stock`);
      return;
    }
    
    try {
      setItemProcessing(productId, true);
      
      if (user) {
        const authItem = cartItems.find(item => item.product_id === productId);
        if (authItem) {
          await dispatch(updateCartItemQuantity({ 
            userId: user.id, 
            productId, 
            quantity: authItem.quantity + 1
          })).unwrap();
        } else {
          // Check if item exists in localItems instead
          const localItem = localItems.find(item => item.product_id === productId);
          if (localItem) {
            // Add to authenticated cart and remove from local
            await dispatch(addItemToCart({
              userId: user.id,
              productId,
              quantity: localItem.quantity + 1
            })).unwrap();
            // Remove from local cart
            dispatch(removeLocalItem({ productId }));
          }
        }
      } else {
        const localItem = localItems.find(item => item.product_id === productId);
        if (localItem) {
          dispatch(incrementLocalItem({ productId }));
        }
      }
    } catch (error) {
      console.error('Error incrementing item:', error);
    } finally {
      setItemProcessing(productId, false);
    }
  }, [user, cartItems, localItems, allItems, stockInfo, dispatch, processingItems, setItemProcessing]);

  const handleDecrement = useCallback(async (productId) => {
    if (processingItems.has(productId)) return;
    
    const currentItem = allItems.find(item => item.product_id === productId);
    if (!currentItem) {
      return;
    }

    try {
      setItemProcessing(productId, true);
      
      if (user) {
        const authItem = cartItems.find(item => item.product_id === productId);
        if (authItem) {
          if (authItem.quantity <= 1) {
            await dispatch(removeItemFromCart({ 
              userId: user.id, 
              productId 
            })).unwrap();
          } else {
            await dispatch(updateCartItemQuantity({ 
              userId: user.id, 
              productId, 
              quantity: authItem.quantity - 1
            })).unwrap();
          }
        } else {
          // Check if item exists in localItems instead
          const localItem = localItems.find(item => item.product_id === productId);
          if (localItem) {
            if (localItem.quantity <= 1) {
              dispatch(removeLocalItem({ productId }));
            } else {
              await dispatch(addItemToCart({
                userId: user.id,
                productId,
                quantity: localItem.quantity - 1
              })).unwrap();
              dispatch(removeLocalItem({ productId }));
            }
          }
        }
      } else {
        const localItem = localItems.find(item => item.product_id === productId);
        if (localItem) {
          dispatch(decrementLocalItem({ productId }));
        }
      }
    } catch (error) {
      console.error('Error decrementing item:', error);
    } finally {
      setItemProcessing(productId, false);
    }
  }, [user, cartItems, localItems, allItems, dispatch, processingItems, setItemProcessing]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="bg-white w-full max-w-md h-full overflow-y-auto">
        <div className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">My Cart</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
        </div>

        {!allItems || allItems.length === 0 ? (
          <div className="p-6 text-center">
            <div className="mb-4">
              <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 11-4 0v-6m4 0V9a2 2 0 10-4 0v4.01" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
            <p className="text-gray-600 mb-4">Add some products to get started</p>
            <button
              onClick={handleClose}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="p-4 space-y-3">
              {allItems.map((item, index) => {
                const isProcessing = processingItems.has(item.product_id);
                const lineTotal = item.unitPrice * item.quantity;
                const stock = stockInfo.get(item.product_id);
                const isLowStock = stock && stock.available <= 5 && stock.available > 0;
                const isOutOfStock = stock && stock.available === 0;
                const canIncrement = stock ? item.quantity < stock.available : true;
                
                return (
                  <div key={`cart-item-${item.product_id}-${index}`} className="flex items-center space-x-3 py-3 border-b border-gray-100 last:border-b-0">
                    {/* Product Image */}
                    <img
                      src={item.product?.image_url || item.product?.images?.[0] || item.product?.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&h=100&fit=crop'}
                      alt={item.product?.name || 'Product'}
                      className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                      loading="lazy"
                    />
                    
                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm leading-tight line-clamp-2">
                        {item.product?.name || 'Product Name'}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.product?.unit || item.product?.quantity_per_unit || '500 ml'}
                      </p>
                      {/* Stock status indicators */}
                      {isOutOfStock && (
                        <p className="text-xs text-red-600 font-medium mt-1">
                          Out of stock
                        </p>
                      )}
                      {isLowStock && !isOutOfStock && (
                        <p className="text-xs text-orange-600 font-medium mt-1">
                          Only {stock.available} left
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-1">
                        <p className="font-semibold text-gray-900 text-sm">
                          {formatCurrency(item.unitPrice)}
                        </p>
                        <p className="text-xs text-gray-600">
                          Total: {formatCurrency(lineTotal)}
                        </p>
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center bg-green-600 rounded-lg px-1 py-1">
                      <button
                        onClick={() => handleDecrement(item.product_id)}
                        disabled={isProcessing || item.quantity <= 0}
                        className="w-7 h-7 flex items-center justify-center text-white hover:bg-green-700 rounded disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-green-300"
                        aria-label="Decrease quantity"
                        title="Decrease quantity"
                      >
                        {isProcessing ? (
                          <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
                          </svg>
                        )}
                      </button>
                      
                      <span 
                        className="w-8 text-center font-medium text-white text-sm" 
                        aria-label={`Quantity: ${item.quantity}`}
                      >
                        {item.quantity}
                      </span>
                      
                      <button
                        onClick={() => handleIncrement(item.product_id)}
                        disabled={isProcessing || !canIncrement || isOutOfStock}
                        className="w-7 h-7 flex items-center justify-center text-white hover:bg-green-700 rounded disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-green-300"
                        aria-label="Increase quantity"
                        title={!canIncrement ? `Only ${stock?.available || 0} available` : "Increase quantity"}
                      >
                        {isProcessing ? (
                          <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bill Details */}
            <div className="border-t border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Bill details</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span className="text-gray-700">Items total ({allItems.length} items)</span>
                  </div>
                  <span className="font-medium text-gray-900">{formatCurrency(itemsTotal)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4M5 7h14a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2z" />
                    </svg>
                    <span className="text-gray-700">Delivery charge</span>
                    <svg className="w-3 h-3 ml-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20" title="Free delivery on orders above ₹199">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-medium text-gray-900">
                    {itemsTotal >= 199 ? (
                      <span className="text-green-600 line-through">{formatCurrency(deliveryCharge)}</span>
                    ) : (
                      formatCurrency(actualDeliveryCharge)
                    )}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <span className="text-gray-700">Handling charge</span>
                    <svg className="w-3 h-3 ml-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20" title="Platform fee">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-medium text-gray-900">{formatCurrency(handlingCharge)}</span>
                </div>

                {/* Savings Display */}
                {itemsTotal >= 199 && (
                  <div className="flex items-center justify-between text-green-600 bg-green-50 px-2 py-1 rounded">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm font-medium">You saved</span>
                    </div>
                    <span className="font-medium">{formatCurrency(deliveryCharge)}</span>
                  </div>
                )}
              </div>
              
              <div className="border-t border-gray-200 mt-4 pt-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900 text-lg">Grand total</span>
                  <span className="font-bold text-xl text-green-600">{formatCurrency(grandTotal)}</span>
                </div>
                {itemsTotal < 199 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Add {formatCurrency(199 - itemsTotal)} more for free delivery
                  </p>
                )}
              </div>
            </div>
            
            {/* Donation Section */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-yellow-200 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-yellow-700 font-bold">🍽️</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm">Feeding India donation</h4>
                    <p className="text-xs text-gray-600">Working towards a malnutrition free India. Feeding India...read more</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium mr-2">₹1</span>
                  <input 
                    type="checkbox" 
                    checked={isDonationSelected}
                    onChange={(e) => setIsDonationSelected(e.target.checked)}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500" 
                  />
                </div>
              </div>
            </div>
            
            {/* Proceed Button */}
            <div className="p-4 bg-gray-50">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold">{formatCurrency(grandTotal)}</span>
                  <span className="text-xs text-gray-500 uppercase tracking-wide">TOTAL</span>
                </div>
                
                <button
                  disabled={loading || allItems.length === 0}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <span>Proceed</span>
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CartSidebar;
