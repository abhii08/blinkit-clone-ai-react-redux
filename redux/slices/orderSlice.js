import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { db } from '../../src/lib/supabase';

// Async thunks for order operations
export const createOrder = createAsyncThunk(
  'order/create',
  async (orderData, { rejectWithValue }) => {
    try {
      const order = await db.createOrder(orderData);
      return order;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserOrders = createAsyncThunk(
  'order/fetchUserOrders',
  async (userId, { rejectWithValue }) => {
    try {
      const orders = await db.getUserOrders(userId);
      return orders;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchOrderById = createAsyncThunk(
  'order/fetchById',
  async (orderId, { rejectWithValue }) => {
    try {
      const order = await db.getOrderById(orderId);
      return order;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  'order/updateStatus',
  async ({ orderId, status, agentId }, { rejectWithValue }) => {
    try {
      const updatedOrder = await db.updateOrderStatus(orderId, status, agentId);
      return updatedOrder;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const assignDeliveryAgent = createAsyncThunk(
  'order/assignAgent',
  async ({ orderId, agentId }, { rejectWithValue }) => {
    try {
      const updatedOrder = await db.assignDeliveryAgent(orderId, agentId);
      return updatedOrder;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Real-time order updates subscription
export const subscribeToOrderUpdates = (orderId) => {
  return (dispatch) => {
    // Set up real-time subscription for order updates
    const subscription = db.subscribeToOrderUpdates(orderId, (payload) => {
      if (payload && payload.new) {
        const updatedOrder = payload.new;
        dispatch(updateOrderInList(updatedOrder));
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
  currentOrder: null,
  userOrders: [],
  orderHistory: [],
  loading: {
    create: false,
    fetch: false,
    update: false,
  },
  error: {
    create: null,
    fetch: null,
    update: null,
  },
  orderStatus: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PREPARING: 'preparing',
    OUT_FOR_DELIVERY: 'out_for_delivery',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
  },
};

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    clearErrors: (state) => {
      state.error = {
        create: null,
        fetch: null,
        update: null,
      };
    },
    clearError: (state, action) => {
      const errorType = action.payload;
      if (state.error[errorType]) {
        state.error[errorType] = null;
      }
    },
    setCurrentOrder: (state, action) => {
      state.currentOrder = action.payload;
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
    updateOrderInList: (state, action) => {
      const updatedOrder = action.payload;
      const index = state.userOrders.findIndex(order => order.id === updatedOrder.id);
      if (index !== -1) {
        state.userOrders[index] = updatedOrder;
      }
      if (state.currentOrder?.id === updatedOrder.id) {
        state.currentOrder = updatedOrder;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Order
      .addCase(createOrder.pending, (state) => {
        state.loading.create = true;
        state.error.create = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading.create = false;
        state.currentOrder = action.payload;
        state.userOrders.unshift(action.payload);
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading.create = false;
        state.error.create = action.payload;
      })
      // Fetch User Orders
      .addCase(fetchUserOrders.pending, (state) => {
        state.loading.fetch = true;
        state.error.fetch = null;
      })
      .addCase(fetchUserOrders.fulfilled, (state, action) => {
        state.loading.fetch = false;
        state.userOrders = action.payload;
      })
      .addCase(fetchUserOrders.rejected, (state, action) => {
        state.loading.fetch = false;
        state.error.fetch = action.payload;
      })
      // Fetch Order By ID
      .addCase(fetchOrderById.pending, (state) => {
        state.loading.fetch = true;
        state.error.fetch = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading.fetch = false;
        state.currentOrder = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading.fetch = false;
        state.error.fetch = action.payload;
      })
      // Update Order Status
      .addCase(updateOrderStatus.pending, (state) => {
        state.loading.update = true;
        state.error.update = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.loading.update = false;
        const updatedOrder = action.payload;
        const index = state.userOrders.findIndex(order => order.id === updatedOrder.id);
        if (index !== -1) {
          state.userOrders[index] = updatedOrder;
        }
        if (state.currentOrder?.id === updatedOrder.id) {
          state.currentOrder = updatedOrder;
        }
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.loading.update = false;
        state.error.update = action.payload;
      })
      // Assign Delivery Agent
      .addCase(assignDeliveryAgent.pending, (state) => {
        state.loading.update = true;
        state.error.update = null;
      })
      .addCase(assignDeliveryAgent.fulfilled, (state, action) => {
        state.loading.update = false;
        const updatedOrder = action.payload;
        const index = state.userOrders.findIndex(order => order.id === updatedOrder.id);
        if (index !== -1) {
          state.userOrders[index] = updatedOrder;
        }
        if (state.currentOrder?.id === updatedOrder.id) {
          state.currentOrder = updatedOrder;
        }
      })
      .addCase(assignDeliveryAgent.rejected, (state, action) => {
        state.loading.update = false;
        state.error.update = action.payload;
      });
  },
});

export const {
  clearErrors,
  clearError,
  setCurrentOrder,
  clearCurrentOrder,
  updateOrderInList,
} = orderSlice.actions;

export default orderSlice.reducer;
