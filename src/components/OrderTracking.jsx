import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrder, useDelivery, useAuth } from '../../redux/hooks';
import { fetchOrderById, subscribeToOrderUpdates } from '../../redux/slices/orderSlice';
import { subscribeToAgentLocation } from '../../redux/slices/deliverySlice';
import { useAuthSession } from '../hooks/useAuthSession';
import UserLocationTracker from './UserLocationTracker';
import GoogleMapTracker from './GoogleMapTracker';

const OrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { currentOrder, loading, dispatch: orderDispatch } = useOrder();
  const { currentAgent, agentLocation, dispatch: deliveryDispatch } = useDelivery();
  const { user } = useAuth();
  useAuthSession(); // Initialize auth session
  
  const [orderStatusHistory, setOrderStatusHistory] = useState([]);
  const subscriptionRef = useRef(null);
  const agentSubscriptionRef = useRef(null);

  useEffect(() => {
    if (orderId) {
      // Fetch order details initially
      orderDispatch(fetchOrderById(orderId));
      
      // Subscribe to real-time order updates
      subscriptionRef.current = orderDispatch(subscribeToOrderUpdates(orderId));
      
      // Add periodic refresh as backup (every 10 seconds)
      const statusRefreshInterval = setInterval(() => {
        console.log('Refreshing order status for real-time updates...');
        orderDispatch(fetchOrderById(orderId));
      }, 10000);
      
      return () => {
        if (subscriptionRef.current) {
          subscriptionRef.current();
        }
        clearInterval(statusRefreshInterval);
      };
    }
  }, [orderId, orderDispatch]);

  useEffect(() => {
    if (currentOrder?.delivery_agent_id) {
      // Subscribe to agent location updates
      agentSubscriptionRef.current = deliveryDispatch(
        subscribeToAgentLocation(currentOrder.delivery_agent_id)
      );
      
      return () => {
        if (agentSubscriptionRef.current) {
          agentSubscriptionRef.current();
        }
      };
    }
  }, [currentOrder?.delivery_agent_id, deliveryDispatch]);

  useEffect(() => {
    if (currentOrder) {
      // Generate status history based on order status
      const history = generateStatusHistory(currentOrder);
      setOrderStatusHistory(history);
    }
  }, [currentOrder?.status, currentOrder?.confirmed_at, currentOrder?.delivery_started_at, currentOrder?.delivered_at]);

  const generateStatusHistory = (order) => {
    const baseTime = new Date(order.created_at);
    const history = [
      {
        status: 'pending',
        title: 'Order Placed',
        description: 'Your order has been received',
        time: baseTime,
        completed: true
      },
      {
        status: 'confirmed',
        title: 'Order Confirmed',
        description: 'Your order has been confirmed and is being prepared',
        time: new Date(baseTime.getTime() + 2 * 60 * 1000),
        completed: ['confirmed', 'preparing', 'out_for_delivery', 'delivered'].includes(order.status)
      },
      {
        status: 'out_for_delivery',
        title: 'Out for Delivery',
        description: 'Your order is on the way',
        time: new Date(baseTime.getTime() + 6 * 60 * 1000),
        completed: ['out_for_delivery', 'delivered'].includes(order.status)
      },
      {
        status: 'delivered',
        title: 'Delivered',
        description: 'Your order has been delivered',
        time: new Date(baseTime.getTime() + 8 * 60 * 1000),
        completed: order.status === 'delivered'
      }
    ];

    // Update times based on actual order timestamps if available
    if (order.confirmed_at) {
      history[1].time = new Date(order.confirmed_at);
    }
    if (order.delivery_started_at) {
      history[2].time = new Date(order.delivery_started_at);
    }
    if (order.delivered_at) {
      history[3].time = new Date(order.delivered_at);
    }

    return history;
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getEstimatedDeliveryTime = () => {
    if (!currentOrder) return null;
    const baseTime = new Date(currentOrder.created_at);
    return new Date(baseTime.getTime() + 8 * 60 * 1000);
  };

  const callDeliveryAgent = () => {
    if (currentAgent?.phone) {
      window.open(`tel:${currentAgent.phone}`);
    }
  };

  if (loading.fetch) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!currentOrder) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Order not found</h2>
          <p className="text-gray-600 mb-6">The order you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const estimatedDelivery = getEstimatedDeliveryTime();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Track Your Order</h1>
                <p className="text-gray-600">Order ID: #{currentOrder.id.slice(-8).toUpperCase()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Estimated Delivery</p>
                <p className="text-lg font-semibold text-green-600">
                  {estimatedDelivery ? formatTime(estimatedDelivery) : 'Calculating...'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Status Timeline */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Status</h2>
              
              <div className="space-y-6">
                {orderStatusHistory.map((step, index) => (
                  <div key={step.status} className="flex items-start space-x-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        step.completed 
                          ? 'bg-green-600 text-white' 
                          : currentOrder.status === step.status || 
                            (step.status === 'out_for_delivery' && currentOrder.status === 'preparing')
                          ? 'bg-yellow-500 text-white animate-pulse'
                          : 'bg-gray-200 text-gray-400'
                      }`}>
                        {step.completed ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-current"></div>
                        )}
                      </div>
                      {index < orderStatusHistory.length - 1 && (
                        <div className={`w-0.5 h-12 mt-2 ${
                          step.completed ? 'bg-green-600' : 'bg-gray-200'
                        }`}></div>
                      )}
                    </div>
                    
                    <div className="flex-1 pb-8">
                      <div className="flex items-center justify-between">
                        <h3 className={`font-medium ${
                          step.completed ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {step.title}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {step.completed ? formatTime(step.time) : ''}
                        </span>
                      </div>
                      <p className={`text-sm ${
                        step.completed ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery Agent Info */}
              {currentAgent && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{currentAgent.name || 'Delivery Agent'}</p>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">★ {currentAgent.rating || '4.8'}</span>
                          <span className="text-sm text-gray-400">•</span>
                          <span className="text-sm text-gray-600 capitalize">{currentAgent.vehicle_type || 'Bike'}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={callDeliveryAgent}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                      Call Agent
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Live Map Tracking */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Live Tracking</h2>
              
              {/* User Location Tracker - enables location sharing for delivery agent */}
              <UserLocationTracker 
                orderId={orderId}
                userId={user?.id}
                isActive={currentOrder?.status === 'out_for_delivery' || currentOrder?.status === 'preparing'}
              />
              
              <div className="h-96 rounded-lg overflow-hidden">
                <GoogleMapTracker
                  userLocation={{
                    lat: currentOrder.delivery_latitude,
                    lng: currentOrder.delivery_longitude
                  }}
                  agentLocation={agentLocation ? {
                    lat: agentLocation.latitude,
                    lng: agentLocation.longitude
                  } : null}
                  orderStatus={currentOrder.status}
                />
              </div>
              
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-gray-600">Your Location</span>
                  </div>
                  {agentLocation && (
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-600">Delivery Agent</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="mt-6 bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Items ({currentOrder.order_items?.length || 0})</h3>
                <div className="space-y-3">
                  {currentOrder.order_items?.map((item, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <img
                        src={item.products?.image_url || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=100&h=100&fit=crop'}
                        alt={item.products?.name || 'Product'}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.products?.name || 'Product'}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity} • ₹{item.total?.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Delivery Address</h3>
                <p className="text-gray-600 mb-4">{currentOrder.delivery_address}</p>
                
                <h3 className="font-medium text-gray-900 mb-3">Bill Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Items Total</span>
                    <span>₹{currentOrder.items_total?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Charge</span>
                    <span>{currentOrder.delivery_charge === 0 ? 'FREE' : `₹${currentOrder.delivery_charge?.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Handling Charge</span>
                    <span>₹{currentOrder.handling_charge?.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-300 pt-2 mt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Total Amount</span>
                      <span className="text-green-600">₹{currentOrder.total_amount?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate('/orders')}
            className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            View All Orders
          </button>
          <button
            onClick={() => navigate('/home')}
            className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
