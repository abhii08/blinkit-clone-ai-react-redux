import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrder, useDelivery } from '../../redux/hooks';
import { fetchOrderById } from '../../redux/slices/orderSlice';
import { fetchAvailableAgents, assignDeliveryAgent } from '../../redux/slices/deliverySlice';
import { db } from '../lib/supabase';

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { currentOrder, loading: orderLoading, dispatch: orderDispatch } = useOrder();
  const { availableAgents, loading: deliveryLoading, dispatch: deliveryDispatch } = useDelivery();
  
  const [agentAssigned, setAgentAssigned] = useState(false);
  const [estimatedDeliveryTime, setEstimatedDeliveryTime] = useState(null);

  useEffect(() => {
    if (orderId) {
      orderDispatch(fetchOrderById(orderId));
    }
  }, [orderId, orderDispatch]);

  useEffect(() => {
    if (currentOrder && !agentAssigned) {
      // Check if order already has an agent assigned
      if (currentOrder.delivery_agent_id) {
        setAgentAssigned(true);
        // Set estimated delivery time (8 minutes from now)
        const deliveryTime = new Date();
        deliveryTime.setMinutes(deliveryTime.getMinutes() + 8);
        setEstimatedDeliveryTime(deliveryTime);
      } else if (currentOrder.status === 'confirmed') {
        // Don't auto-assign - let delivery agents accept orders manually from their dashboard
        // Order will appear in "Available Orders" section for agents to accept
        console.log('Order confirmed, waiting for delivery agent to accept:', currentOrder.id);
      }
    }
  }, [currentOrder, agentAssigned]);

  const assignAgent = async () => {
    if (!currentOrder) return;

    try {
      setAgentAssigned(true);
      
      // Verify order exists before attempting assignment
      const orderExists = await db.getOrderById(currentOrder.id);
      if (!orderExists) {
        throw new Error(`Order ${currentOrder.id} not found in database`);
      }
      
      console.log('Order verification successful:', {
        orderId: currentOrder.id,
        status: orderExists.status,
        userId: orderExists.user_id
      });
      
      // Get available agents
      const agents = await db.getAvailableDeliveryAgents(0, 0);
      
      if (agents.length > 0) {
        // Assign first available agent
        const agent = agents[0];
        
        // Use the assignDeliveryAgent function which updates the order and returns the updated data
        const updatedOrder = await db.assignDeliveryAgent(currentOrder.id, agent.id);
        
        // Update agent status to busy
        await db.updateAgentStatus(agent.id, 'busy');
        
        // Refresh order data to get the latest state
        orderDispatch(fetchOrderById(currentOrder.id));
        
        // Set estimated delivery time (8 minutes from now)
        const deliveryTime = new Date();
        deliveryTime.setMinutes(deliveryTime.getMinutes() + 8);
        setEstimatedDeliveryTime(deliveryTime);
      } else {
        throw new Error('No available delivery agents found');
      }
    } catch (error) {
      console.error('Error assigning agent:', error);
      setAgentAssigned(false);
      
      // Show user-friendly error message
      if (error.message.includes('not found')) {
        console.error('Order verification failed - order may not exist in database');
      } else if (error.message.includes('No available')) {
        console.error('No delivery agents available at the moment');
      }
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'confirmed': return 'text-green-600 bg-green-100';
      case 'preparing': return 'text-blue-600 bg-blue-100';
      case 'out_for_delivery': return 'text-purple-600 bg-purple-100';
      case 'delivered': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Order Received';
      case 'confirmed': return 'Order Confirmed';
      case 'out_for_delivery': return 'Out for Delivery';
      case 'delivered': return 'Delivered';
      default: return 'Processing';
    }
  };

  if (orderLoading.fetch) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Header */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
            <p className="text-gray-600 mb-4">Your order has been placed successfully</p>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              Order ID: #{currentOrder.id.slice(-8).toUpperCase()}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Status */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Current Status</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentOrder.status)}`}>
                    {getStatusText(currentOrder.status)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Order Time</span>
                  <span className="font-medium">{formatTime(currentOrder.created_at)}</span>
                </div>
                
                {estimatedDeliveryTime && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Estimated Delivery</span>
                    <span className="font-medium text-green-600">{formatTime(estimatedDeliveryTime)}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Payment Method</span>
                  <span className="font-medium">Cash on Delivery</span>
                </div>
              </div>

              {/* Delivery Agent Assignment */}
              {deliveryLoading.fetch ? (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600"></div>
                    <p className="text-yellow-800 font-medium">Searching for delivery agents...</p>
                  </div>
                </div>
              ) : agentAssigned ? (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Delivery Agent Assigned</p>
                      <p className="text-sm text-gray-600">Your order will be delivered in 8 minutes</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">No Delivery Agents Available</p>
                      <p className="text-sm text-gray-600">We're looking for available agents in your area. Your order will be processed as soon as an agent comes online.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Track Order Button */}
              <button
                onClick={() => navigate(`/track-order/${currentOrder.id}`)}
                className="w-full mt-6 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Track Your Order
              </button>
            </div>
          </div>

          {/* Delivery Details */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Details</h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-gray-600 text-sm">Delivering to</p>
                  <p className="font-medium text-gray-900">{currentOrder.delivery_address}</p>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-medium text-gray-900 mb-3">Order Items ({currentOrder.order_items?.length || 0})</h3>
                  <div className="space-y-3">
                    {currentOrder.order_items?.map((item, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <img
                          src={item.products?.image_url || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=100&h=100&fit=crop'}
                          alt={item.products?.name || 'Product'}
                          className="w-10 h-10 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">{item.products?.name || 'Product'}</p>
                          <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-medium text-gray-900 text-sm">₹{item.total?.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
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
        </div>

        {/* Additional Actions */}
        <div className="mt-6 bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate('/orders')}
                className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                View All Orders
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
