import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDelivery, useOrder } from '../../redux/hooks';
import { 
  fetchAgentOrders, 
  updateAgentLocation, 
  updateAgentStatus,
  startDelivery,
  completeDelivery 
} from '../../redux/slices/deliverySlice';
import { updateOrderStatus } from '../../redux/slices/orderSlice';
import { canAccessDeliveryFeatures, getRoleContext, ROLES } from '../utils/roleContext';
import { useRoleBasedAuth } from '../hooks/useRoleBasedAuth';
import { useLogout } from '../hooks/useLogout';
import GoogleMapTracker from './GoogleMapTracker';
import DeliveryAuthModal from './DeliveryAuthModal.jsx';
import DeliveryAgentOrderTracker from './DeliveryAgentOrderTracker.jsx';
import { supabase } from '../lib/supabase';

const DeliveryAgentDashboard = () => {
  const navigate = useNavigate();
  const { user: effectiveUser, isAuthenticated: roleAuthenticated, isLoading: authLoading, clearCurrentTabAuth } = useRoleBasedAuth();
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
  const [availableOrders, setAvailableOrders] = useState([]);
  const [realTimeSubscription, setRealTimeSubscription] = useState(null);

  // Remove the duplicate checkAgentProfile function since it's defined later

  useEffect(() => {
    // Don't do anything while auth is still loading
    if (authLoading) {
      console.log('Auth still loading, waiting...');
      return;
    }

    // Check role context first
    const currentRole = getRoleContext();
    console.log('DeliveryAgentDashboard - Current role:', currentRole);
    console.log('DeliveryAgentDashboard - Effective user:', effectiveUser?.email);
    
    if (currentRole === ROLES.USER) {
      // If this tab is set for user, redirect to home
      navigate('/home');
      return;
    }
    
    // If no role context is set, redirect to role selection
    if (!currentRole) {
      console.log('No role context found, redirecting to role selection');
      navigate('/');
      return;
    }
    
    // If role context is delivery agent but no effective user, show auth modal immediately
    if (currentRole === ROLES.DELIVERY_AGENT && !effectiveUser) {
      console.log('Delivery agent role context exists but no effective user - showing auth modal');
      setShowAuthModal(true);
      return;
    }

    const checkAgentProfile = async () => {
      if (!effectiveUser) {
        console.log('No effective user found after auth loading completed');
        setShowAuthModal(true);
        return;
      }

      try {
        console.log('Checking agent profile for user:', effectiveUser.id);
        
        const { data: agentData, error } = await supabase
          .from('delivery_agents')
          .select('*')
          .eq('user_id', effectiveUser.id)
          .single();

        if (error) {
          console.error('Error fetching agent profile:', error);
          if (error.code === 'PGRST116') {
            console.log('No agent profile found for user');
          }
          setShowAuthModal(true);
          return;
        }

        if (agentData) {
          console.log('Agent profile found:', agentData);
          setAgentProfile(agentData);
        } else {
          console.log('No agent profile found');
          setShowAuthModal(true);
        }
      } catch (error) {
        console.error('Unexpected error in checkAgentProfile:', error);
        setShowAuthModal(true);
      }
    };

    // Check if user has delivery agent profile
    checkAgentProfile();
  }, [effectiveUser, authLoading, deliveryDispatch, navigate]);

  // Fetch available orders when component mounts and agent is online
  useEffect(() => {
    if (agentProfile?.id && isOnline) {
      console.log('Agent is online, fetching available orders...');
      fetchAvailableOrders();
      // Also refresh agent's own orders
      deliveryDispatch(fetchAgentOrders(agentProfile.id));
    } else if (agentProfile?.id && !isOnline) {
      console.log('Agent is offline, clearing available orders...');
      setAvailableOrders([]);
    }
  }, [agentProfile?.id, isOnline]);

  const handleAuthSuccess = (user, agentData) => {
    setAgentProfile(agentData);
    setShowAuthModal(false);
    // Set online status based on database status
    const isAgentOnline = agentData.status === 'available' || agentData.status === 'busy' || agentData.status === 'delivering';
    setIsOnline(isAgentOnline);
    
    // Fetch agent orders and available orders if online
    deliveryDispatch(fetchAgentOrders(agentData.id));
    if (isAgentOnline) {
      fetchAvailableOrders();
    }
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

  // Periodically sync agent status with database and set up real-time order subscriptions
  useEffect(() => {
    if (!agentProfile?.id) return;

    const syncAgentStatus = async () => {
      try {
        if (!agentProfile?.id) {
          console.warn('No agent profile ID available for status sync');
          return;
        }

        const { data: agentData, error } = await supabase
          .from('delivery_agents')
          .select('status')
          .eq('id', agentProfile.id)
          .single();

        if (error) {
          console.error('Error syncing agent status:', error);
          if (error.code === 'PGRST116') {
            console.warn('Agent profile not found during status sync');
          }
          return;
        }

        const currentStatus = agentData?.status || 'offline';
        setIsOnline(currentStatus === 'available' || currentStatus === 'online');
      } catch (error) {
        console.error('Unexpected error in syncAgentStatus:', error);
      }
    };

    // Set up real-time subscription for new orders
    const setupRealTimeSubscription = () => {
      if (realTimeSubscription) {
        realTimeSubscription.unsubscribe();
      }

      const subscription = supabase
        .channel('public:orders', { config: { broadcast: { self: true } } })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        }, (payload) => {
          console.log('New order received via real-time:', payload.new);
          const newOrder = payload.new;
          // Check if this order is available for agents (confirmed status, no agent assigned)
          if (newOrder.status === 'confirmed' && !newOrder.delivery_agent_id && isOnline) {
            console.log('New confirmed order available, adding to list...');
            // Add the new order directly to the available orders list
            setAvailableOrders(prevOrders => {
              // Check if order already exists to avoid duplicates
              const orderExists = prevOrders.some(order => order.id === newOrder.id);
              if (!orderExists) {
                return [newOrder, ...prevOrders];
              }
              return prevOrders;
            });
            // Also refresh to get complete order data with relations
            fetchAvailableOrders();
          }
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders'
        }, (payload) => {
          console.log('Order updated via real-time:', payload.new);
          const updatedOrder = payload.new;
          
          // Refresh available orders if order becomes available or gets assigned
          if (isOnline) {
            // If order becomes confirmed and available
            if (updatedOrder.status === 'confirmed' && !updatedOrder.delivery_agent_id) {
              console.log('Order became available, refreshing orders...');
              fetchAvailableOrders();
            }
            // If order gets assigned to someone else, remove from available
            else if (updatedOrder.delivery_agent_id) {
              console.log('Order was assigned, refreshing orders...');
              fetchAvailableOrders();
            }
          }
          
          // Update agent's own orders if this order belongs to them
          if (updatedOrder.delivery_agent_id === agentProfile?.id) {
            console.log('Agent order updated, refreshing agent orders...');
            deliveryDispatch(fetchAgentOrders(agentProfile.id));
          }
        })
        .subscribe((status, err) => {
          console.log('Real-time subscription status:', status);
          if (err) {
            console.error('Subscription error:', err);
          }
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to real-time orders');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Channel error, attempting to reconnect...');
            // Retry subscription after a delay
            setTimeout(() => {
              if (agentProfile?.id && isOnline) {
                setupRealTimeSubscription();
              }
            }, 5000);
          }
        });

      setRealTimeSubscription(subscription);
    };

    // Sync immediately and then every 30 seconds
    syncAgentStatus();
    const interval = setInterval(syncAgentStatus, 30000);

    // Set up real-time subscription and fetch orders
    setupRealTimeSubscription();
    if (isOnline) {
      fetchAvailableOrders();
    }

    // Set up periodic refresh as fallback (every 10 seconds for testing)
    const refreshInterval = setInterval(() => {
      if (isOnline && agentProfile?.id) {
        console.log('Periodic refresh of available orders...');
        fetchAvailableOrders();
        deliveryDispatch(fetchAgentOrders(agentProfile.id));
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      clearInterval(refreshInterval);
      if (realTimeSubscription) {
        realTimeSubscription.unsubscribe();
      }
    };
  }, [agentProfile?.id, isOnline]);

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
          agentId: effectiveUser.id,
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
    if (!agentProfile?.id) {
      console.error('No agent profile available for status update');
      return;
    }

    const newStatus = isOnline ? 'offline' : 'available';
    
    try {
      await deliveryDispatch(updateAgentStatus({
        agentId: agentProfile.id,
        status: newStatus
      }));
      
      setIsOnline(!isOnline);
      
      if (newStatus === 'available') {
        // Start location tracking when going online
        startLocationTracking();
        // Fetch available orders immediately when going online
        try {
          await fetchAvailableOrders();
        } catch (fetchError) {
          console.error('Error fetching available orders:', fetchError);
        }
      } else {
        // Stop location tracking when going offline
        stopLocationTracking();
        // Clear available orders
        setAvailableOrders([]);
        // Unsubscribe from real-time updates
        if (realTimeSubscription) {
          try {
            realTimeSubscription.unsubscribe();
          } catch (unsubError) {
            console.error('Error unsubscribing from real-time updates:', unsubError);
          }
          setRealTimeSubscription(null);
        }
      }
    } catch (error) {
      console.error('Error updating agent status:', error);
    }
  };

  // Fetch available orders for delivery
  const fetchAvailableOrders = async () => {
    try {
      console.log('Fetching available orders...');
      
      // First, let's check all orders to debug
      const { data: allOrders, error: allError } = await supabase
        .from('orders')
        .select('id, status, delivery_agent_id, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(10);
      
      console.log('All recent orders:', allOrders);
      
      // Check specifically for confirmed orders without agents
      const { data: pendingOrders, error: pendingError } = await supabase
        .from('orders')
        .select('id, status, delivery_agent_id, created_at, user_id')
        .eq('status', 'confirmed')
        .is('delivery_agent_id', null);
      
      console.log('Pending orders without agents:', pendingOrders);
      
      // Fetch orders that are pending and ready for delivery
      const { data: availableOrders, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_id,
            quantity,
            unit_price,
            total_price,
            products (
              name,
              unit
            )
          )
        `)
        .eq('status', 'confirmed')
        .is('delivery_agent_id', null)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching available orders:', error);
        return;
      }

      console.log('Available orders query result:', availableOrders);
      console.log('Available orders count:', availableOrders?.length || 0);
      
      // Update the available orders state
      if (availableOrders) {
        console.log(`Found ${availableOrders.length} available orders for delivery`);
        setAvailableOrders(availableOrders);
      } else {
        setAvailableOrders([]);
      }
      
    } catch (error) {
      console.error('Error in fetchAvailableOrders:', error);
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      console.log('Accepting order:', orderId);
      
      // Assign the order to this delivery agent
      const { error: assignError } = await supabase
        .from('orders')
        .update({ 
          delivery_agent_id: agentProfile.id,
          status: 'preparing'
        })
        .eq('id', orderId);

      if (assignError) {
        console.error('Error assigning order:', assignError);
        alert('Failed to accept order');
        return;
      }

      // Update agent status to busy
      const statusResult = await deliveryDispatch(updateAgentStatus({
        agentId: agentProfile.id,
        status: 'busy'
      }));
      
      // Update local state if successful
      if (statusResult.type === 'delivery/updateAgentStatus/fulfilled') {
        setIsOnline(true); // busy means online
        setAgentProfile(prev => ({ ...prev, status: 'busy' }));
      }

      // Refresh orders to show updated list
      await fetchAvailableOrders();
      deliveryDispatch(fetchAgentOrders(agentProfile.id));
      
      alert('Order accepted successfully!');
    } catch (error) {
      console.error('Error accepting order:', error);
      alert('Failed to accept order');
    }
  };

  const handleStartDelivery = async (orderId) => {
    try {
      await deliveryDispatch(startDelivery({
        orderId,
        agentId: effectiveUser.id
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
        agentId: effectiveUser.id
      }));
      
      await orderDispatch(updateOrderStatus({
        orderId,
        status: 'delivered'
      }));
      
      setSelectedOrder(null);
      
      // Refresh orders
      deliveryDispatch(fetchAgentOrders(effectiveUser.id));
    } catch (error) {
      console.error('Error completing delivery:', error);
      alert('Failed to complete delivery');
    }
  };

  const { logout } = useLogout();

  const handleLogout = async () => {
    try {
      // Update agent status to offline before logging out
      if (agentProfile?.id) {
        await deliveryDispatch(updateAgentStatus({
          agentId: agentProfile.id,
          status: 'offline'
        }));
        // Update local state
        setIsOnline(false);
        setAgentProfile(prev => ({ ...prev, status: 'offline' }));
      }

      // Stop location tracking
      stopLocationTracking();

      // Use the proper logout hook
      const result = await logout();
      
      if (!result.success) {
        console.error('Logout failed:', result.error);
        // Still navigate even if logout had issues
        navigate('/', { replace: true });
      }
    } catch (error) {
      console.error('Error during logout:', error);
      navigate('/', { replace: true });
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

  // Show loading state while auth is loading or checking agent profile
  if (authLoading || (!agentProfile && effectiveUser)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {authLoading ? 'Loading authentication...' : 'Loading dashboard...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Profile Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg shadow-lg mb-6 text-white">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Profile Avatar */}
                <div className="relative">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-2xl font-bold">
                    {(agentProfile?.full_name || effectiveUser?.user_metadata?.full_name || effectiveUser?.email || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${
                    isOnline ? 'bg-green-400' : 'bg-gray-400'
                  }`}></div>
                </div>
                
                {/* Profile Info */}
                <div>
                  <p className="text-gray-600">Welcome back, {agentProfile?.full_name || effectiveUser?.user_metadata?.full_name || effectiveUser?.email || 'Agent'}</p>
                  <div className="flex items-center space-x-4 text-green-100">
                    <div className="flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                      </svg>
                      <span className="text-sm">{agentProfile?.email || effectiveUser?.email}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                      </svg>
                      <span className="text-sm">{agentProfile?.phone || 'Not provided'}</span>
                    </div>
                  </div>
                  
                  {/* Vehicle Info */}
                  <div className="mt-2 flex items-center space-x-4">
                    <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                      </svg>
                      <span className="text-sm font-medium capitalize">
                        {agentProfile?.vehicle_type || 'Vehicle'}
                      </span>
                    </div>
                    <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                      <span className="text-sm font-medium">
                        {agentProfile?.vehicle_number || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right text-white">
                  <p className="text-sm text-green-100">Current Status</p>
                  <div className="flex items-center justify-end space-x-2">
                    <span className={`font-medium text-lg ${
                      isOnline ? 'text-green-200' : 'text-gray-300'
                    }`}>
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={handleToggleOnlineStatus}
                  className={`px-6 py-2 rounded-lg font-medium transition-all transform hover:scale-105 ${
                    isOnline 
                      ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg' 
                      : 'bg-white text-green-700 hover:bg-green-50 shadow-lg'
                  }`}
                >
                  {isOnline ? 'Go Offline' : 'Go Online'}
                </button>

                <button
                  onClick={handleLogout}
                  className="px-6 py-2 rounded-lg font-medium bg-white bg-opacity-20 text-white hover:bg-opacity-30 transition-all transform hover:scale-105 border border-white border-opacity-30"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Agent Performance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Deliveries</p>
                <p className="text-2xl font-bold text-gray-900">{agentProfile?.total_deliveries || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">{agentProfile?.success_rate || 100}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg. Rating</p>
                <p className="text-2xl font-bold text-gray-900">{agentProfile?.average_rating || 4.8}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg. Time</p>
                <p className="text-2xl font-bold text-gray-900">{agentProfile?.average_delivery_time || 25}m</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Available Orders (when online) */}
          {isOnline && (
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  Available Orders ({availableOrders?.length || 0})
                </h2>
                
                {availableOrders?.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-600">No orders available</p>
                    <p className="text-sm text-gray-500 mt-1">Waiting for new customer orders...</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {availableOrders.map((order) => (
                      <div
                        key={order.id}
                        className="border border-blue-200 rounded-lg p-4 hover:border-blue-300 transition-colors bg-blue-50"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-medium text-gray-900">Order #{order.id.slice(-8)}</h3>
                            <p className="text-sm text-gray-600">
                              {formatTime(order.created_at)} • {formatCurrency(order.total_amount)}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                              {order.status}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <p className="text-sm text-gray-600 mb-1">Delivery Address:</p>
                          <p className="text-sm font-medium text-gray-900">
                            {order.addresses?.address_line_1}, {order.addresses?.city}
                          </p>
                        </div>

                        <div className="mb-4">
                          <p className="text-sm text-gray-600 mb-2">Items ({order.order_items?.length || 0}):</p>
                          <div className="space-y-1">
                            {order.order_items?.slice(0, 2).map((item, index) => (
                              <p key={index} className="text-xs text-gray-700">
                                {item.quantity}x {item.products?.name || 'Product'}
                              </p>
                            ))}
                            {order.order_items?.length > 2 && (
                              <p className="text-xs text-gray-500">
                                +{order.order_items.length - 2} more items
                              </p>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleAcceptOrder(order.id)}
                          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                        >
                          Accept Order
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Assigned Orders */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                My Orders ({agentOrders?.length || 0})
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
                      
                      {/* User Location Tracker for this order */}
                      <DeliveryAgentOrderTracker 
                        order={order} 
                        agentId={agentProfile?.id} 
                      />
                      
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
