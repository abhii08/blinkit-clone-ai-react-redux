import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { db } from '../../src/lib/supabase';

// Async thunks for location operations
export const fetchUserAddresses = createAsyncThunk(
  'location/fetchAddresses',
  async (userId, { rejectWithValue }) => {
    try {
      const addresses = await db.getUserAddresses(userId);
      return addresses;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addNewAddress = createAsyncThunk(
  'location/addAddress',
  async (addressData, { rejectWithValue }) => {
    try {
      const newAddress = await db.addAddress(addressData);
      return newAddress;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateAddress = createAsyncThunk(
  'location/updateAddress',
  async ({ addressId, addressData }, { rejectWithValue }) => {
    try {
      const updatedAddress = await db.updateAddress(addressId, addressData);
      return updatedAddress;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteAddress = createAsyncThunk(
  'location/deleteAddress',
  async (addressId, { rejectWithValue }) => {
    try {
      await db.deleteAddress(addressId);
      return addressId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchNearbyStores = createAsyncThunk(
  'location/fetchNearbyStores',
  async ({ latitude, longitude, radiusKm }, { rejectWithValue }) => {
    try {
      const stores = await db.getNearbyStores(latitude, longitude, radiusKm);
      return stores;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  currentLocation: null,
  selectedAddress: null,
  addresses: [],
  nearbyStores: [],
  loading: false,
  error: null,
  isLocationSelectorOpen: false,
  locationPermission: null, // 'granted', 'denied', 'prompt'
};

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentLocation: (state, action) => {
      state.currentLocation = action.payload;
    },
    setSelectedAddress: (state, action) => {
      state.selectedAddress = action.payload;
    },
    openLocationSelector: (state) => {
      state.isLocationSelectorOpen = true;
    },
    closeLocationSelector: (state) => {
      state.isLocationSelectorOpen = false;
    },
    setLocationPermission: (state, action) => {
      state.locationPermission = action.payload;
    },
    selectLocationFromMap: (state, action) => {
      const { lat, lng, address, addressComponents } = action.payload;
      state.selectedAddress = {
        latitude: lat,
        longitude: lng,
        formatted_address: address,
        address_components: addressComponents,
        city: addressComponents?.city || '',
        state: addressComponents?.state || '',
        postal_code: addressComponents?.postal_code || '',
        country: addressComponents?.country || 'India',
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch User Addresses
      .addCase(fetchUserAddresses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserAddresses.fulfilled, (state, action) => {
        state.loading = false;
        state.addresses = action.payload;
        // Set default address if available
        const defaultAddress = action.payload.find(addr => addr.is_default);
        if (defaultAddress && !state.selectedAddress) {
          state.selectedAddress = defaultAddress;
        }
      })
      .addCase(fetchUserAddresses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add New Address
      .addCase(addNewAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addNewAddress.fulfilled, (state, action) => {
        state.loading = false;
        state.addresses.push(action.payload);
        if (action.payload.is_default) {
          state.selectedAddress = action.payload;
        }
      })
      .addCase(addNewAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Address
      .addCase(updateAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAddress.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.addresses.findIndex(addr => addr.id === action.payload.id);
        if (index !== -1) {
          state.addresses[index] = action.payload;
          if (state.selectedAddress?.id === action.payload.id) {
            state.selectedAddress = action.payload;
          }
        }
      })
      .addCase(updateAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete Address
      .addCase(deleteAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAddress.fulfilled, (state, action) => {
        state.loading = false;
        state.addresses = state.addresses.filter(addr => addr.id !== action.payload);
        if (state.selectedAddress?.id === action.payload) {
          state.selectedAddress = state.addresses.find(addr => addr.is_default) || null;
        }
      })
      .addCase(deleteAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Nearby Stores
      .addCase(fetchNearbyStores.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNearbyStores.fulfilled, (state, action) => {
        state.loading = false;
        state.nearbyStores = action.payload;
      })
      .addCase(fetchNearbyStores.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  setCurrentLocation,
  setSelectedAddress,
  openLocationSelector,
  closeLocationSelector,
  setLocationPermission,
  selectLocationFromMap,
} = locationSlice.actions;

export default locationSlice.reducer;
