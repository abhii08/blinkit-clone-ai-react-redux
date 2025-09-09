import { useState, useEffect } from 'react';
import { useLocation, useAuth } from '../../redux/hooks';
import { fetchUserAddresses, addNewAddress, setCurrentLocation, setSelectedAddress, selectLocationFromMap, closeLocationSelector } from '../../redux/slices/locationSlice';
import { db } from '../lib/supabase';
import GoogleMapPicker from './GoogleMapPicker';

const LocationSelector = ({ isOpen }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [newAddress, setNewAddress] = useState({
    type: 'home',
    full_name: '',
    phone: '',
    address_line_1: '',
    address_line_2: '',
    landmark: '',
    city: '',
    state: '',
    pincode: ''
  });

  const { user } = useAuth();
  const { 
    addresses,
    currentLocation,
    loading,
    dispatch
  } = useLocation();
  
  const handleClose = () => {
    dispatch(closeLocationSelector());
  };

  useEffect(() => {
    if (user && isOpen) {
      dispatch(fetchUserAddresses(user.id));
    }
  }, [user, isOpen, dispatch]);

  const handleCurrentLocation = async () => {
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            
            // Set current location in Redux
            dispatch(setCurrentLocation({ latitude, longitude }));
            
            // Set as selected address
            dispatch(setSelectedAddress({
              type: 'current',
              formatted_address: `Current Location (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`,
              latitude,
              longitude
            }));
            
            handleClose();
          },
          (error) => {
            console.error('Error getting current location:', error);
            alert('Unable to get your current location. Please check your browser permissions.');
          }
        );
      } else {
        alert('Geolocation is not supported by this browser.');
      }
    } catch (error) {
      console.error('Error getting current location:', error);
    }
  };

  const handleAddressSelect = (address) => {
    dispatch(setSelectedAddress(address));
    handleClose();
  };

  const handleMapLocationSelect = (mapData) => {
    dispatch(selectLocationFromMap(mapData));
    setShowMapPicker(false);
    handleClose();
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    
    try {
      const addressData = {
        ...newAddress,
        user_id: user.id,
        latitude: 0, // Will be geocoded on backend
        longitude: 0
      };
      
      await dispatch(addNewAddress(addressData)).unwrap();
      setShowAddForm(false);
      setNewAddress({
        type: 'home',
        full_name: '',
        phone: '',
        address_line_1: '',
        address_line_2: '',
        landmark: '',
        city: '',
        state: '',
        pincode: ''
      });
    } catch (error) {
      console.error('Error adding address:', error);
      alert('Error adding address. Please check the details and try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Select Delivery Location</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {!showAddForm && !showMapPicker ? (
            <div className="space-y-4">
              {/* Current Location Option */}
              <button
                onClick={handleCurrentLocation}
                disabled={loading}
                className="w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left flex items-center space-x-3"
              >
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Use Current Location</p>
                  <p className="text-sm text-gray-500">We'll detect your location automatically</p>
                </div>
              </button>

              {/* Select on Map Option */}
              <button
                onClick={() => setShowMapPicker(true)}
                className="w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left flex items-center space-x-3"
              >
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Select on Map</p>
                  <p className="text-sm text-gray-500">Choose your exact location on the map</p>
                </div>
              </button>

              {/* Saved Addresses */}
              {addresses.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Saved Addresses</h3>
                  <div className="space-y-2">
                    {addresses.map((address) => (
                      <button
                        key={address.id}
                        onClick={() => handleAddressSelect(address)}
                        className="w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                                {address.type}
                              </span>
                              {address.is_default && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="font-medium text-gray-900">{address.full_name}</p>
                            <p className="text-sm text-gray-600">
                              {address.address_line_1}
                              {address.address_line_2 && `, ${address.address_line_2}`}
                            </p>
                            <p className="text-sm text-gray-600">
                              {address.city}, {address.state} {address.pincode}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Address Button */}
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-center"
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-gray-600 font-medium">Add New Address</span>
                </div>
              </button>
            </div>
          ) : showMapPicker ? (
            /* Google Maps Location Picker */
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Select Location on Map</h3>
                <button
                  type="button"
                  onClick={() => setShowMapPicker(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
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
              
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowMapPicker(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* Add Address Form */
            <form onSubmit={handleAddAddress} className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add New Address</h3>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Type</label>
                <select
                  value={newAddress.type}
                  onChange={(e) => setNewAddress({ ...newAddress, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="home">Home</option>
                  <option value="work">Work</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newAddress.full_name}
                    onChange={(e) => setNewAddress({ ...newAddress, full_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    required
                    value={newAddress.phone}
                    onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                <input
                  type="text"
                  required
                  value={newAddress.address_line_1}
                  onChange={(e) => setNewAddress({ ...newAddress, address_line_1: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="House/Flat/Office No, Building Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2 (Optional)</label>
                <input
                  type="text"
                  value={newAddress.address_line_2}
                  onChange={(e) => setNewAddress({ ...newAddress, address_line_2: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Street, Area"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Landmark (Optional)</label>
                <input
                  type="text"
                  value={newAddress.landmark}
                  onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Near famous place"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={newAddress.state}
                    onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                <input
                  type="text"
                  required
                  pattern="[0-9]{6}"
                  value={newAddress.pincode}
                  onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="6-digit pincode"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Address'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationSelector;
