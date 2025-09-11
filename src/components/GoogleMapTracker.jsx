import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

const GoogleMapTracker = ({ 
  userLocation, 
  agentLocation, 
  orderStatus,
  height = '400px' 
}) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [userMarker, setUserMarker] = useState(null);
  const [agentMarker, setAgentMarker] = useState(null);
  const [routePolyline, setRoutePolyline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const initializeMap = useCallback(async () => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey || apiKey === 'your_google_maps_api_key') {
      setError('Google Maps API key not configured');
      setLoading(false);
      return;
    }

    try {
      const loader = new Loader({
        apiKey: apiKey,
        version: 'weekly',
        libraries: ['marker', 'geometry'],
        region: 'IN',
        language: 'en'
      });

      const google = await loader.load();
      
      const defaultCenter = userLocation || { lat: 23.0225, lng: 72.5714 };
      
      const mapInstance = new google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      // Create user location marker (destination)
      const userMarkerInstance = new google.maps.Marker({
        position: userLocation,
        map: mapInstance,
        title: 'Delivery Location',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="12" fill="#dc2626" stroke="white" stroke-width="3"/>
              <circle cx="16" cy="16" r="4" fill="white"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 16)
        }
      });

      // Create agent marker if location is available
      let agentMarkerInstance = null;
      if (agentLocation) {
        agentMarkerInstance = new google.maps.Marker({
          position: agentLocation,
          map: mapInstance,
          title: 'Delivery Agent',
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="12" fill="#2563eb" stroke="white" stroke-width="3"/>
                <path d="M16 8l3 6h5l-4 3 1.5 6-5.5-4-5.5 4 1.5-6-4-3h5z" fill="white"/>
              </svg>
            `),
            scaledSize: new google.maps.Size(32, 32),
            anchor: new google.maps.Point(16, 16)
          }
        });

        // Draw route between agent and user if both locations exist
        drawRoute(google, mapInstance, agentLocation, userLocation);
        
        // Fit map to show both markers
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(userLocation);
        bounds.extend(agentLocation);
        mapInstance.fitBounds(bounds);
        
        // Ensure minimum zoom level
        const listener = google.maps.event.addListener(mapInstance, 'bounds_changed', () => {
          if (mapInstance.getZoom() > 16) {
            mapInstance.setZoom(16);
          }
          google.maps.event.removeListener(listener);
        });
      }

      setMap(mapInstance);
      setUserMarker(userMarkerInstance);
      setAgentMarker(agentMarkerInstance);
      setLoading(false);

    } catch (error) {
      console.error('Error loading Google Maps:', error);
      setError('Failed to load map');
      setLoading(false);
    }
  }, [userLocation, agentLocation]);

  const drawRoute = (google, mapInstance, start, end) => {
    // Clear existing route
    if (routePolyline) {
      routePolyline.setMap(null);
    }

    // Create a simple straight line route (in production, use Directions API)
    const routePath = [start, end];
    
    const polyline = new google.maps.Polyline({
      path: routePath,
      geodesic: true,
      strokeColor: '#2563eb',
      strokeOpacity: 0.8,
      strokeWeight: 4,
      map: mapInstance
    });

    setRoutePolyline(polyline);
  };

  // Update agent marker position when agentLocation changes
  useEffect(() => {
    if (agentMarker && agentLocation && map) {
      agentMarker.setPosition(agentLocation);
      
      // Update route
      if (userLocation) {
        const google = window.google;
        drawRoute(google, map, agentLocation, userLocation);
      }
      
      // Animate to new position
      map.panTo(agentLocation);
    }
  }, [agentLocation, agentMarker, map, userLocation]);

  // Create agent marker when location becomes available
  useEffect(() => {
    if (map && agentLocation && !agentMarker) {
      const google = window.google;
      
      const agentMarkerInstance = new google.maps.Marker({
        position: agentLocation,
        map: map,
        title: 'Delivery Agent',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="12" fill="#2563eb" stroke="white" stroke-width="3"/>
              <path d="M16 8l3 6h5l-4 3 1.5 6-5.5-4-5.5 4 1.5-6-4-3h5z" fill="white"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 16)
        }
      });

      setAgentMarker(agentMarkerInstance);
      
      // Draw route and fit bounds
      if (userLocation) {
        drawRoute(google, map, agentLocation, userLocation);
        
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(userLocation);
        bounds.extend(agentLocation);
        map.fitBounds(bounds);
      }
    }
  }, [map, agentLocation, agentMarker, userLocation]);

  useEffect(() => {
    initializeMap();
  }, [initializeMap]);

  const calculateDistance = () => {
    if (!userLocation || !agentLocation) return null;
    
    const R = 6371; // Earth's radius in km
    const dLat = (agentLocation.lat - userLocation.lat) * Math.PI / 180;
    const dLng = (agentLocation.lng - userLocation.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(agentLocation.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;
  };

  const getStatusMessage = () => {
    switch (orderStatus) {
      case 'pending':
        return 'Looking for a delivery agent...';
      case 'confirmed':
        return 'Order confirmed, preparing your items...';
      case 'preparing':
        return 'Your order is being prepared...';
      case 'out_for_delivery':
        return agentLocation ? 'Your delivery agent is on the way!' : 'Out for delivery...';
      case 'delivered':
        return 'Order delivered successfully!';
      default:
        return 'Processing your order...';
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
        <div className="text-center p-6">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <p className="text-gray-600">Unable to load tracking map</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-20 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading tracking map...</p>
          </div>
        </div>
      )}

      {/* Status Banner */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="bg-white p-3 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                orderStatus === 'out_for_delivery' ? 'bg-green-500 animate-pulse' : 'bg-blue-500'
              }`}></div>
              <p className="text-sm font-medium text-gray-900">{getStatusMessage()}</p>
            </div>
            {agentLocation && (
              <div className="text-right">
                <p className="text-xs text-gray-600">Distance</p>
                <p className="text-sm font-semibold text-green-600">{calculateDistance()}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div
        ref={mapRef}
        style={{ height }}
        className="w-full rounded-lg border border-gray-300"
      />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="bg-white p-3 rounded-lg shadow-md border border-gray-200">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
              <span className="text-xs text-gray-600">Your Location</span>
            </div>
            {agentLocation && (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                <span className="text-xs text-gray-600">Delivery Agent</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Real-time indicator */}
      {agentLocation && orderStatus === 'out_for_delivery' && (
        <div className="absolute top-20 right-4 z-10">
          <div className="bg-green-100 border border-green-200 p-2 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-700 font-medium">Live Tracking</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleMapTracker;
