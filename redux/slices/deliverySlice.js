import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { db } from '../../src/lib/supabase';

// Async thunks for delivery operations
export const fetchAvailableAgents = createAsyncThunk(
  'delivery/fetchAvailableAgents',
  async ({ latitude, longitude, radius = 5 }, { rejectWithValue }) => {
    try {
      const agents = await db.getAvailableDeliveryAgents(latitude, longitude, radius);
      return agents;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateAgentLocation = createAsyncThunk(
  'delivery/updateAgentLocation',
  async ({ agentId, latitude, longitude }, { rejectWithValue }) => {
    try {
      const result = await db.updateAgentLocation(agentId, latitude, longitude);
      return { agentId, latitude, longitude, timestamp: new Date().toISOString() };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAgentOrders = createAsyncThunk(
  'delivery/fetchAgentOrders',
  async (agentId, { rejectWithValue }) => {
    try {
      const orders = await db.getAgentOrders(agentId);
      return orders;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateAgentStatus = createAsyncThunk(
  'delivery/updateAgentStatus',
  async ({ agentId, status }, { rejectWithValue }) => {
    try {
      const result = await db.updateAgentStatus(agentId, status);
      return { agentId, status };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const assignDeliveryAgent = createAsyncThunk(
  'delivery/assignDeliveryAgent',
  async ({ orderId, agentId }, { rejectWithValue }) => {
    try {
      const result = await db.assignDeliveryAgent(orderId, agentId);
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const startDelivery = createAsyncThunk(
  'delivery/startDelivery',
  async ({ orderId, agentId }, { rejectWithValue }) => {
    try {
      const result = await db.startDelivery(orderId, agentId);
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const completeDelivery = createAsyncThunk(
  'delivery/completeDelivery',
  async ({ orderId, agentId }, { rejectWithValue }) => {
    try {
      const result = await db.completeDelivery(orderId, agentId);
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Real-time location subscription
export const subscribeToAgentLocation = (agentId) => {
  return (dispatch) => {
    // Set up real-time subscription for agent location updates
    const subscription = db.subscribeToAgentLocation(agentId, (payload) => {
      if (payload && payload.new) {
        const locationData = payload.new;
        dispatch(updateAgentLocationLocal({
          agentId,
          latitude: locationData.latitude,
          longitude: locationData.longitude
        }));
      }
    });

    // Return unsubscribe function
    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  };
};

const initialState = {
  // Agent management
  availableAgents: [],
  currentAgent: null,
  agentOrders: [],
  agentStatus: 'offline', // 'offline', 'available', 'busy', 'delivering'
  
  // Location tracking
  agentLocation: null,
  customerLocation: null,
  trackingData: {},
  
  // Real-time tracking
  isTracking: false,
  trackingOrderId: null,
  estimatedDeliveryTime: null,
  
  // Loading states
  loading: {
    agents: false,
    location: false,
    orders: false,
    status: false,
    assignment: false,
  },
  
  // Error states
  error: {
    agents: null,
    location: null,
    orders: null,
    status: null,
    assignment: null,
  },
  
  // Agent statuses
  agentStatuses: {
    OFFLINE: 'offline',
    AVAILABLE: 'available',
    BUSY: 'busy',
    DELIVERING: 'delivering',
  },
};

const deliverySlice = createSlice({
  name: 'delivery',
  initialState,
  reducers: {
    clearErrors: (state) => {
      state.error = {
        agents: null,
        location: null,
        orders: null,
        status: null,
      };
    },
    clearError: (state, action) => {
      const errorType = action.payload;
      if (state.error[errorType]) {
        state.error[errorType] = null;
      }
    },
    setCurrentAgent: (state, action) => {
      state.currentAgent = action.payload;
    },
    setAgentLocation: (state, action) => {
      const { latitude, longitude, timestamp } = action.payload;
      state.agentLocation = { latitude, longitude, timestamp };
    },
    setCustomerLocation: (state, action) => {
      const { latitude, longitude } = action.payload;
      state.customerLocation = { latitude, longitude };
    },
    startTracking: (state, action) => {
      state.isTracking = true;
      state.trackingOrderId = action.payload;
    },
    stopTracking: (state) => {
      state.isTracking = false;
      state.trackingOrderId = null;
    },
    updateTrackingData: (state, action) => {
      const { orderId, agentLocation, customerLocation, estimatedTime } = action.payload;
      state.trackingData[orderId] = {
        agentLocation,
        customerLocation,
        estimatedTime,
        lastUpdated: new Date().toISOString(),
      };
    },
    setEstimatedDeliveryTime: (state, action) => {
      state.estimatedDeliveryTime = action.payload;
    },
    updateAgentLocationLocal: (state, action) => {
      const { agentId, latitude, longitude } = action.payload;
      if (state.currentAgent?.id === agentId) {
        state.agentLocation = { latitude, longitude, timestamp: new Date().toISOString() };
      }
      // Update in available agents list
      const agentIndex = state.availableAgents.findIndex(agent => agent.id === agentId);
      if (agentIndex !== -1) {
        state.availableAgents[agentIndex].latitude = latitude;
        state.availableAgents[agentIndex].longitude = longitude;
        state.availableAgents[agentIndex].last_location_update = new Date().toISOString();
      }
    },
    addAgentOrder: (state, action) => {
      const newOrder = action.payload;
      const existingIndex = state.agentOrders.findIndex(order => order.id === newOrder.id);
      if (existingIndex !== -1) {
        state.agentOrders[existingIndex] = newOrder;
      } else {
        state.agentOrders.unshift(newOrder);
      }
    },
    removeAgentOrder: (state, action) => {
      const orderId = action.payload;
      state.agentOrders = state.agentOrders.filter(order => order.id !== orderId);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Available Agents
      .addCase(fetchAvailableAgents.pending, (state) => {
        state.loading.agents = true;
        state.error.agents = null;
      })
      .addCase(fetchAvailableAgents.fulfilled, (state, action) => {
        state.loading.agents = false;
        state.availableAgents = action.payload;
      })
      .addCase(fetchAvailableAgents.rejected, (state, action) => {
        state.loading.agents = false;
        state.error.agents = action.payload;
      })
      // Update Agent Location
      .addCase(updateAgentLocation.pending, (state) => {
        state.loading.location = true;
        state.error.location = null;
      })
      .addCase(updateAgentLocation.fulfilled, (state, action) => {
        state.loading.location = false;
        const { agentId, latitude, longitude, timestamp } = action.payload;
        if (state.currentAgent?.id === agentId) {
          state.agentLocation = { latitude, longitude, timestamp };
        }
      })
      .addCase(updateAgentLocation.rejected, (state, action) => {
        state.loading.location = false;
        state.error.location = action.payload;
      })
      // Fetch Agent Orders
      .addCase(fetchAgentOrders.pending, (state) => {
        state.loading.orders = true;
        state.error.orders = null;
      })
      .addCase(fetchAgentOrders.fulfilled, (state, action) => {
        state.loading.orders = false;
        state.agentOrders = action.payload;
      })
      .addCase(fetchAgentOrders.rejected, (state, action) => {
        state.loading.orders = false;
        state.error.orders = action.payload;
      })
      // Update Agent Status
      .addCase(updateAgentStatus.pending, (state) => {
        state.loading.status = true;
        state.error.status = null;
      })
      .addCase(updateAgentStatus.fulfilled, (state, action) => {
        state.loading.status = false;
        const { agentId, status } = action.payload;
        if (state.currentAgent?.id === agentId) {
          state.agentStatus = status;
          state.currentAgent.status = status;
        }
      })
      .addCase(updateAgentStatus.rejected, (state, action) => {
        state.loading.status = false;
        state.error.status = action.payload;
      })
      // Start Delivery
      .addCase(startDelivery.pending, (state) => {
        state.loading.status = true;
        state.error.status = null;
      })
      .addCase(startDelivery.fulfilled, (state, action) => {
        state.loading.status = false;
        state.agentStatus = 'delivering';
      })
      .addCase(startDelivery.rejected, (state, action) => {
        state.loading.status = false;
        state.error.status = action.payload;
      })
      // Complete Delivery
      .addCase(completeDelivery.pending, (state) => {
        state.loading.status = true;
        state.error.status = null;
      })
      .addCase(completeDelivery.fulfilled, (state, action) => {
        state.loading.status = false;
        state.agentStatus = 'available';
        // Remove completed order from agent orders
        const completedOrder = action.payload;
        state.agentOrders = state.agentOrders.filter(order => order.id !== completedOrder.id);
      })
      .addCase(completeDelivery.rejected, (state, action) => {
        state.loading.status = false;
        state.error.status = action.payload;
      })
      // Assign Delivery Agent
      .addCase(assignDeliveryAgent.pending, (state) => {
        state.loading.assignment = true;
        state.error.assignment = null;
      })
      .addCase(assignDeliveryAgent.fulfilled, (state, action) => {
        state.loading.assignment = false;
        // Update current agent if assignment was successful
        if (action.payload) {
          state.currentAgent = action.payload;
        }
      })
      .addCase(assignDeliveryAgent.rejected, (state, action) => {
        state.loading.assignment = false;
        state.error.assignment = action.payload;
      });
  },
});

export const {
  clearErrors,
  clearError,
  setCurrentAgent,
  setAgentLocation,
  setCustomerLocation,
  startTracking,
  stopTracking,
  updateTrackingData,
  setEstimatedDeliveryTime,
  updateAgentLocationLocal,
  addAgentOrder,
  removeAgentOrder,
} = deliverySlice.actions;

export default deliverySlice.reducer;
