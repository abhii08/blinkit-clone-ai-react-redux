import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useDelivery, useOrder } from '../../redux/hooks';
import { 
  fetchAgentOrders, 
  updateAgentLocation, 
  updateAgentStatus,
  startDelivery,
  completeDelivery 
} from '../../redux/slices/deliverySlice';
import { updateOrderStatus } from '../../redux/slices/orderSlice';
import GoogleMapTracker from './GoogleMapTracker';
import DeliveryAuthModal from './DeliveryAuthModal.jsx';
import { supabase } from '../lib/supabase';

const DeliveryAgentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    currentAgent, 
    agentOrders, 
    agentLocation, 
    loading, 
    dispatch: deliveryDispatch 
  } = useDelivery();
  const { dispatch: orderDispatch } = useOrder();
  
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [locationWatcher, setLocationWatcher] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [agentProfile, setAgentProfile] = useState(null);

  const checkAgentProfile = async () => {
    if (!user) return;

    try {
      const { data: agentData, error } = await supabase
        .from('delivery_agents')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error || !agentData) {
        setShowAuthModal(true);
        return;
      }

      setAgentProfile(agentData);
      setIsOnline(agentData.status !== 'offline');
      
      // Fetch agent orders
      deliveryDispatch(fetchAgentOrders(user.id));
    } catch (error) {
      console.error('Error checking agent profile:', error);
      setShowAuthModal(true);
    }
  };

  useEffect(() => {
    const checkAgentProfile = async () => {
      if (!user) return;

      try {
        const { data: agentData, error } = await supabase
          .from('delivery_agents')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching agent profile:', error);
          // Only show auth modal for specific errors, not RLS issues
          if (error.code === 'PGRST116' || error.message.includes('No rows found')) {
            setShowAuthModal(true);
          } else {
            // For other errors (like RLS), retry after a short delay
            setTimeout(() => checkAgentProfile(), 1000);
          }
          return;
        }

        if (!agentData) {
          setShowAuthModal(true);
          return;
        }

        setAgentProfile(agentData);
        setIsOnline(agentData.status !== 'offline');
        setShowAuthModal(false); // Ensure modal is hidden on success
        
        // Fetch agent orders
        deliveryDispatch(fetchAgentOrders(user.id));
      } catch (error) {
        console.error('Error checking agent profile:', error);
        // Retry once more before showing auth modal
        setTimeout(() => {
          setShowAuthModal(true);
        }, 2000);
      }
    };

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    // Check if user has delivery agent profile
    checkAgentProfile();
  }, [user, deliveryDispatch]);

  const handleAuthSuccess = (user, agentData) => {
    setAgentProfile(agentData);
    setShowAuthModal(false);
    setIsOnline(agentData.status !== 'offline');
    
    // Fetch agent orders
    deliveryDispatch(fetchAgentOrders(user.id));
  };

  useEffect(() => {
    // Start location tracking when agent goes online
    if (isOnline && !locationWatcher) {
      startLocationTracking();
    } else if (!isOnline && locationWatcher) {
      stopLocationTracking();
    }

    return () => {
      if (locationWatcher) {
        navigator.geolocation.clearWatch(locationWatcher);
      }
    };
  }, [isOnline, locationWatcher]);

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString()
        };

        deliveryDispatch(updateAgentLocation({
          agentId: user.id,
          location
        }));
      },
      (error) => {
        console.error('Location tracking error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );

    setLocationWatcher(watchId);
  };

  const stopLocationTracking = () => {
    if (locationWatcher) {
      navigator.geolocation.clearWatch(locationWatcher);
      setLocationWatcher(null);
    }
  };

  const handleToggleOnlineStatus = async () => {
    const newStatus = isOnline ? 'offline' : 'available';
    
    try {
      await deliveryDispatch(updateAgentStatus({
        agentId: user.id,
        status: newStatus
      }));
      
      setIsOnline(!isOnline);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handleStartDelivery = async (orderId) => {
    try {
      await deliveryDispatch(startDelivery({
        orderId,
        agentId: user.id
      }));
      
      await orderDispatch(updateOrderStatus({
        orderId,
        status: 'out_for_delivery'
      }));
      
      setSelectedOrder(orderId);
    } catch (error) {
      console.error('Error starting delivery:', error);
      alert('Failed to start delivery');
    }
  };

  const handleCompleteDelivery = async (orderId) => {
    try {
      await deliveryDispatch(completeDelivery({
        orderId,
        agentId: user.id
      }));
      
      await orderDispatch(updateOrderStatus({
        orderId,
        status: 'delivered'
      }));
      
      setSelectedOrder(null);
      
      // Refresh orders
      deliveryDispatch(fetchAgentOrders(user.id));
    } catch (error) {
      console.error('Error completing delivery:', error);
      alert('Failed to complete delivery');
    }
  };

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-purple-100 text-purple-800';
      case 'out_for_delivery': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatCurrency = (amount) => {
    return `₹${amount?.toFixed(2) || '0.00'}`;
  };

  // Show authentication modal if user is not authenticated or not a delivery agent
  if (showAuthModal) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DeliveryAuthModal
          isOpen={showAuthModal}
          onClose={() => navigate('/')}
          onSuccess={handleAuthSuccess}
        />
      </div>
    );
  }

  // Show loading state while checking agent profile
  if (!agentProfile && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Delivery Dashboard</h1>
                <p className="text-gray-600">Welcome back, {agentProfile?.full_name || user?.user_metadata?.full_name || user?.email || 'Agent'}</p>
                <p className="text-sm text-gray-500">{agentProfile?.vehicle_type} • {agentProfile?.vehicle_number}</p>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Status</p>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      isOnline ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                    <span className={`font-medium ${
                      isOnline ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={handleToggleOnlineStatus}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    isOnline 
                      ? 'bg-red-600 text-white hover:bg-red-700' 
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {isOnline ? 'Go Offline' : 'Go Online'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Orders List */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Assigned Orders ({agentOrders?.length || 0})
              </h2>
              
              {loading.orders ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading orders...</p>
                </div>
              ) : agentOrders?.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v1M7 8h10l-1 8H8l-1-8z" />
                  </svg>
                  <p className="text-gray-600">No orders assigned</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {isOnline ? 'Waiting for new orders...' : 'Go online to receive orders'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {agentOrders.map((order) => (
                    <div
                      key={order.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedOrder === order.id 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedOrder(order.id)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            Order #{order.id.slice(-8).toUpperCase()}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatTime(order.created_at)}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                          {order.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-start space-x-2">
                          <svg className="w-4 h-4 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <p className="text-sm text-gray-600 flex-1">
                            {order.delivery_address}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-600">
                            {order.order_items?.length || 0} items • {formatCurrency(order.total_amount)}
                          </p>
                          
                          {order.status === 'preparing' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartDelivery(order.id);
                              }}
                              className="bg-green-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-green-700 transition-colors"
                            >
                              Start Delivery
                            </button>
                          )}
                          
                          {order.status === 'out_for_delivery' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCompleteDelivery(order.id);
                              }}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                            >
                              Mark Delivered
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Map and Order Details */}
          <div className="space-y-6">
            {/* Live Map */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Live Tracking</h2>
                
                <div className="h-80 rounded-lg overflow-hidden">
                  {selectedOrder && agentOrders?.find(o => o.id === selectedOrder) ? (
                    <GoogleMapTracker
                      userLocation={{
                        lat: agentOrders.find(o => o.id === selectedOrder).delivery_latitude,
                        lng: agentOrders.find(o => o.id === selectedOrder).delivery_longitude
                      }}
                      agentLocation={agentLocation ? {
                        lat: agentLocation.latitude,
                        lng: agentLocation.longitude
                      } : null}
                      orderStatus={agentOrders.find(o => o.id === selectedOrder).status}
                    />
                  ) : (
                    <div className="h-full bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                        <p className="text-gray-600">Select an order to view map</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Selected Order Details */}
            {selectedOrder && agentOrders?.find(o => o.id === selectedOrder) && (
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h2>
                  
                  {(() => {
                    const order = agentOrders.find(o => o.id === selectedOrder);
                    return (
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-medium text-gray-900 mb-2">Customer Information</h3>
                          <p className="text-sm text-gray-600">Order #{order.id.slice(-8).toUpperCase()}</p>
                          <p className="text-sm text-gray-600">Payment: {order.payment_method?.toUpperCase() || 'COD'}</p>
                        </div>
                        
                        <div>
                          <h3 className="font-medium text-gray-900 mb-2">Items ({order.order_items?.length || 0})</h3>
                          <div className="space-y-2">
                            {order.order_items?.map((item, index) => (
                              <div key={index} className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">
                                  {item.products?.name || 'Product'} × {item.quantity}
                                </span>
                                <span className="font-medium">{formatCurrency(item.total)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="border-t pt-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Items Total</span>
                            <span>{formatCurrency(order.items_total)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Delivery Charge</span>
                            <span>{order.delivery_charge === 0 ? 'FREE' : formatCurrency(order.delivery_charge)}</span>
                          </div>
                          <div className="flex justify-between font-semibold">
                            <span>Total Amount</span>
                            <span className="text-green-600">{formatCurrency(order.total_amount)}</span>
                          </div>
                        </div>
                        
                        {order.notes && (
                          <div>
                            <h3 className="font-medium text-gray-900 mb-2">Special Instructions</h3>
                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{order.notes}</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryAgentDashboard;
