import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useCart, useLocation, useOrder } from '../../redux/hooks';
import { createOrder } from '../../redux/slices/orderSlice';
import { clearCart, clearLocalCart } from '../../redux/slices/cartSlice';
import { openLocationSelector } from '../../redux/slices/uiSlice';
import GoogleMapPicker from './GoogleMapPicker';

const OrderPlacement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items: cartItems, localItems, totalAmount, dispatch: cartDispatch } = useCart();
  const { selectedAddress, currentLocation, dispatch: locationDispatch } = useLocation();
  const { loading, dispatch: orderDispatch } = useOrder();
  
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');

  // Combine cart items
  const allItems = [...cartItems, ...localItems];
  const deliveryCharge = totalAmount >= 199 ? 0 : 30;
  const handlingCharge = 9;
  const grandTotal = totalAmount + deliveryCharge + handlingCharge;

  useEffect(() => {
    if (selectedAddress) {
      setDeliveryLocation({
        latitude: selectedAddress.latitude,
        longitude: selectedAddress.longitude,
        address: selectedAddress.formatted_address || `${selectedAddress.address_line_1}, ${selectedAddress.city}`,
        type: 'saved'
      });
    } else if (currentLocation) {
      setDeliveryLocation({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        address: 'Current Location',
        type: 'current'
      });
    }
  }, [selectedAddress, currentLocation]);

  const handleLocationSelect = () => {
    locationDispatch(openLocationSelector());
  };

  const handleMapLocationSelect = (mapData) => {
    setDeliveryLocation({
      latitude: mapData.lat,
      longitude: mapData.lng,
      address: mapData.address,
      type: 'map'
    });
    setShowMapPicker(false);
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      alert('Please login to place an order');
      return;
    }

    if (!deliveryLocation) {
      alert('Please select a delivery location');
      return;
    }

    if (allItems.length === 0) {
      alert('Your cart is empty');
      return;
    }

    try {
      // Debug cart items structure
      console.log('Cart items for order:', allItems);
      
      const orderItems = allItems.map(item => {
        // Handle both server cart items (with products relation) and local cart items
        const product = item.products || item.product || item;
        const price = product.price || item.price || item.unitPrice || 0;
        const productName = product.name || item.name || 'Product Name';
        const productUnit = product.unit || item.unit || item.quantity || '500ml';
        
        console.log('Processing item:', {
          id: item.product_id || item.id,
          quantity: item.quantity,
          price: price,
          name: productName,
          unit: productUnit,
          item: item
        });
        
        return {
          product_id: item.product_id || item.id,
          quantity: item.quantity,
          unit_price: price,
          total: price * item.quantity, // Required by database schema
          total_price: price * item.quantity, // For compatibility
          product_name: productName,
          product_unit: productUnit
        };
      });

      const orderData = {
        user_id: user.id,
        total_amount: grandTotal,
        delivery_charge: deliveryCharge,
        handling_charge: handlingCharge,
        items_total: totalAmount,
        delivery_latitude: deliveryLocation.latitude,
        delivery_longitude: deliveryLocation.longitude,
        delivery_address: deliveryLocation.address,
        payment_method: paymentMethod,
        notes: orderNotes,
        order_items: orderItems
      };
      
      console.log('Final order data:', orderData);

      const newOrder = await orderDispatch(createOrder(orderData)).unwrap();
      
      // Clear cart after successful order
      if (user) {
        cartDispatch(clearCart(user.id));
      } else {
        cartDispatch(clearLocalCart());
      }

      // Navigate to order confirmation
      navigate(`/order-confirmation/${newOrder.id}`);
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    }
  };

  if (allItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add some items to your cart to place an order</p>
          <button
            onClick={() => navigate('/')}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Place Your Order</h1>
          </div>

          <div className="p-6 space-y-6">
            {/* Delivery Location Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Location</h2>
              
              {deliveryLocation ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div>
                        <p className="font-medium text-gray-900">
                          {deliveryLocation.type === 'current' ? 'Current Location' : 'Selected Location'}
                        </p>
                        <p className="text-sm text-gray-600">{deliveryLocation.address}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleLocationSelect}
                      className="text-green-600 hover:text-green-700 font-medium text-sm"
                    >
                      Change
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-gray-600 mb-4">Select your delivery location</p>
                  <div className="space-y-2">
                    <button
                      onClick={handleLocationSelect}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Choose from Saved Addresses
                    </button>
                    <button
                      onClick={() => setShowMapPicker(true)}
                      className="w-full border border-green-600 text-green-600 py-2 px-4 rounded-lg hover:bg-green-50 transition-colors"
                    >
                      Select on Map
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items ({allItems.length})</h2>
              <div className="space-y-3">
                {allItems.map((item, index) => {
                  // Handle both server cart items (with products relation) and local cart items
                  const product = item.products || item.product || item;
                  const productName = product.name || item.name || 'Product Name';
                  const productUnit = product.unit || item.unit || item.quantity || '500ml';
                  const productPrice = product.price || item.price || item.unitPrice || 0;
                  const productImage = product.image_url || product.image || item.image || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=100&h=100&fit=crop';
                  
                  return (
                    <div key={`${item.product_id || item.id}-${index}`} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <img
                        src={productImage}
                        alt={productName}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{productName}</h3>
                        <p className="text-sm text-gray-600">{productUnit}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">₹{(productPrice * item.quantity).toFixed(2)}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Notes */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Special Instructions (Optional)</h2>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Add any special instructions for your order..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                rows={3}
              />
            </div>

            {/* Payment Method */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h2>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-green-600 focus:ring-green-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Cash on Delivery</p>
                    <p className="text-sm text-gray-600">Pay when your order arrives</p>
                  </div>
                </label>
                <label className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 opacity-50">
                  <input
                    type="radio"
                    name="payment"
                    value="online"
                    disabled
                    className="text-green-600 focus:ring-green-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Online Payment</p>
                    <p className="text-sm text-gray-600">Coming soon</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Bill Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Bill Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Items total ({allItems.length} items)</span>
                  <span>₹{totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery charge</span>
                  <span>{deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between">
                  <span>Handling charge</span>
                  <span>₹{handlingCharge.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-300 pt-2 mt-2">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Grand Total</span>
                    <span className="text-green-600">₹{grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Place Order Button */}
            <button
              onClick={handlePlaceOrder}
              disabled={loading.create || !deliveryLocation}
              className="w-full bg-green-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading.create ? 'Placing Order...' : `Place Order - ₹${grandTotal.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>

      {/* Map Picker Modal */}
      {showMapPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Select Delivery Location</h3>
                <button
                  onClick={() => setShowMapPicker(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <GoogleMapPicker
                initialLocation={currentLocation ? {
                  lat: currentLocation.latitude,
                  lng: currentLocation.longitude
                } : null}
                onLocationSelect={handleMapLocationSelect}
                height="400px"
                zoom={15}
              />
              
              <div className="mt-4 flex gap-3 justify-end">
                <button
                  onClick={() => setShowMapPicker(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderPlacement;
