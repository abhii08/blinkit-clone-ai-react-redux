import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const DeliveryAgentOrderTracker = ({ order, agentId }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [distance, setDistance] = useState(null);

  useEffect(() => {
    if (!order?.id) return;

    // Subscribe to order updates to get real-time user location
    const subscription = supabase
      .channel(`order-tracking-${order.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${order.id}`
      }, (payload) => {
        const updatedOrder = payload.new;
        if (updatedOrder.user_current_latitude && updatedOrder.user_current_longitude) {
          const newUserLocation = {
            latitude: updatedOrder.user_current_latitude,
            longitude: updatedOrder.user_current_longitude,
            updated_at: updatedOrder.user_location_updated_at
          };
          setUserLocation(newUserLocation);
          
          // Calculate distance if agent location is available
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
              const agentLat = position.coords.latitude;
              const agentLng = position.coords.longitude;
              const userLat = newUserLocation.latitude;
              const userLng = newUserLocation.longitude;
              
              const calculatedDistance = calculateDistance(agentLat, agentLng, userLat, userLng);
              setDistance(calculatedDistance);
            });
          }
        }
      })
      .subscribe();

    // Initial fetch of user location from order
    if (order.user_current_latitude && order.user_current_longitude) {
      setUserLocation({
        latitude: order.user_current_latitude,
        longitude: order.user_current_longitude,
        updated_at: order.user_location_updated_at
      });
    }

    return () => {
      subscription.unsubscribe();
    };
  }, [order?.id]);

  // Haversine formula to calculate distance between two points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    return distance;
  };

  const openInMaps = () => {
    if (userLocation) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${userLocation.latitude},${userLocation.longitude}`;
      window.open(url, '_blank');
    }
  };

  if (!userLocation) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
          <p className="text-sm text-gray-600">Waiting for customer location...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
          <h3 className="text-sm font-medium text-green-900">Customer Location</h3>
        </div>
        {distance && (
          <span className="text-sm font-medium text-green-700">
            {distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`} away
          </span>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="text-sm text-green-700">
          <p>Lat: {userLocation.latitude.toFixed(6)}</p>
          <p>Lng: {userLocation.longitude.toFixed(6)}</p>
        </div>
        
        {userLocation.updated_at && (
          <p className="text-xs text-green-600">
            Last updated: {new Date(userLocation.updated_at).toLocaleTimeString()}
          </p>
        )}
        
        <button
          onClick={openInMaps}
          className="w-full mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
        >
          Navigate to Customer
        </button>
      </div>
    </div>
  );
};

export default DeliveryAgentOrderTracker;
