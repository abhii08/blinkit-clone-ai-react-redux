import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const UserLocationTracker = ({ orderId, userId, isActive = false }) => {
  const [location, setLocation] = useState(null);
  const [locationWatcher, setLocationWatcher] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isActive && orderId && userId) {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }

    return () => stopLocationTracking();
  }, [isActive, orderId, userId]);

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString()
        };

        setLocation(newLocation);
        setError(null);

        // Update user location in database for delivery agent to track
        try {
          await supabase
            .from('orders')
            .update({
              user_current_latitude: newLocation.latitude,
              user_current_longitude: newLocation.longitude,
              user_location_updated_at: newLocation.timestamp
            })
            .eq('id', orderId)
            .eq('user_id', userId);
        } catch (err) {
          console.error('Error updating user location:', err);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setError(`Location error: ${error.message}`);
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

  if (!isActive) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center mb-2">
        <div className="w-3 h-3 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
        <h3 className="text-sm font-medium text-blue-900">Location Sharing Active</h3>
      </div>
      
      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : location ? (
        <div className="text-sm text-blue-700">
          <p>Your delivery agent can track your location for better service</p>
          <p className="text-xs text-blue-600 mt-1">
            Last updated: {new Date(location.timestamp).toLocaleTimeString()}
          </p>
        </div>
      ) : (
        <p className="text-sm text-blue-600">Getting your location...</p>
      )}
    </div>
  );
};

export default UserLocationTracker;
