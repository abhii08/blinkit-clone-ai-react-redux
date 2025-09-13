import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

const GoogleMapPicker = ({ 
  initialLocation, 
  onLocationSelect, 
  height = '400px',
  zoom = 15 
}) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState('');

  const initializeMap = useCallback(async () => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey || apiKey === 'your_google_maps_api_key') {
      setError('Google Maps API key not configured. Please add a valid VITE_GOOGLE_MAPS_API_KEY to your .env file.');
      setLoading(false);
      return;
    }

    try {
      // Add error handling for API key issues
      window.gm_authFailure = () => {
        setError('Google Maps API authentication failed. Please check your API key and billing account.');
        setLoading(false);
      };

      const loader = new Loader({
        apiKey: apiKey,
        version: 'weekly',
        libraries: ['marker', 'places'],
        region: 'IN',
        language: 'en'
      });

      const google = await loader.load();
      
      const defaultLocation = initialLocation || { lat: 23.0225, lng: 72.5714 }; // Ahmedabad
      
      const mapInstance = new google.maps.Map(mapRef.current, {
        center: defaultLocation,
        zoom: zoom,
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

      // Use regular marker to avoid billing and compatibility issues
      const markerInstance = new google.maps.Marker({
        position: defaultLocation,
        map: mapInstance,
        draggable: true,
        title: 'Drag to select location'
      });

      // Function to get address from coordinates (without geocoder to avoid billing issues)
      const getAddressFromCoords = async (lat, lng) => {
        try {
          // Generate a location name based on coordinates
          const locationCode = `${lng.toFixed(6)}`;
          const address = `Delivery Location ${locationCode}`;
          setSelectedAddress(address);
          console.log('Selected coordinates:', { lat, lng });
        } catch (error) {
          console.error('Error getting address from coordinates:', error);
          setSelectedAddress('Unknown Location');
        }
      };

      // Initial address lookup
      getAddressFromCoords(defaultLocation.lat, defaultLocation.lng);

      // Handle marker drag
      markerInstance.addListener('dragend', (event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        getAddressFromCoords(lat, lng);
      });

      // Handle map click
      mapInstance.addListener('click', (event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        
        markerInstance.setPosition({ lat, lng });
        getAddressFromCoords(lat, lng);
      });

      // Simple search functionality without deprecated SearchBox
      const handleSearch = async (query) => {
        if (!query.trim()) return;
        
        try {
          // Use a simple text-based search approach
          // This is a basic implementation - in production, you'd use Places API (New)
          console.log('Search query:', query);
          // For now, just log the search - can be enhanced later
        } catch (error) {
          console.error('Search error:', error);
        }
      };

      setMap(mapInstance);
      setMarker(markerInstance);
      setLoading(false);

    } catch (error) {
      console.error('Error loading Google Maps:', error);
      setError('Failed to load Google Maps. Please check your API key and internet connection.');
      setLoading(false);
    }
  }, [initialLocation, onLocationSelect, zoom]);

  useEffect(() => {
    initializeMap();
  }, [initializeMap]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        if (map && marker) {
          marker.setPosition(location);
          map.setCenter(location);
          map.setZoom(16);
          
          // Get address for current location
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode(
            { location },
            (results, status) => {
              if (status === 'OK' && results[0]) {
                const address = results[0].formatted_address;
                setSelectedAddress(address);
                
                const components = results[0].address_components;
                const addressData = {
                  formatted_address: address,
                  latitude: location.lat,
                  longitude: location.lng,
                  components: components.reduce((acc, component) => {
                    component.types.forEach(type => {
                      acc[type] = component.long_name;
                    });
                    return acc;
                  }, {})
                };
                
                onLocationSelect && onLocationSelect(addressData);
              }
              setLoading(false);
            }
          );
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Unable to get your current location. ';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Location access was denied. Please enable location permissions in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable. Please try again.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out. Please try again.';
            break;
          default:
            errorMessage += 'An unknown error occurred.';
            break;
        }
        
        setError(errorMessage);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000
      }
    );
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
        <div className="text-center p-6">
          <svg className="w-12 h-12 mx-auto text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Map Loading Failed</h3>
          <p className="text-gray-600 text-sm mb-4">{error}</p>
          <div className="space-y-2">
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                initializeMap();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Try Again
            </button>
            <div className="text-xs text-gray-500 mt-2">
              <details>
                <summary className="cursor-pointer">Troubleshooting</summary>
                <div className="mt-2 text-left">
                  <p>• Check if Google Maps API key is valid</p>
                  <p>• Ensure billing is enabled in Google Cloud Console</p>
                  <p>• Verify Maps JavaScript API is enabled</p>
                  <p>• For location issues, enable browser permissions</p>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Search Box */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="flex space-x-2">
          <input
            id="map-search-input"
            type="text"
            placeholder="Search for a location..."
            className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          <button
            onClick={getCurrentLocation}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Use current location"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-20 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div
        ref={mapRef}
        style={{ height }}
        className="w-full rounded-lg border border-gray-300"
      />

      {/* Selected Address Display with Select Button */}
      {selectedAddress && (
        <div className="absolute bottom-16 left-4 right-4 z-10">
          <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Selected Location</p>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{selectedAddress}</p>
                <button
                  onClick={() => {
                    if (marker && onLocationSelect) {
                      const position = marker.getPosition();
                      onLocationSelect({
                        lat: position.lat(),
                        lng: position.lng(),
                        address: selectedAddress,
                        addressComponents: {}
                      });
                    }
                  }}
                  className="mt-3 w-full bg-green-600 text-white py-2.5 px-4 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors shadow-sm"
                >
                  Confirm This Location
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-3 text-center">
        <p className="text-xs text-gray-500">
          Click on the map or drag the marker to select your location
        </p>
      </div>
    </div>
  );
};

export default GoogleMapPicker;
