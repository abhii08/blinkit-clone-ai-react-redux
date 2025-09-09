import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { db } from '../../src/lib/supabase';

// Async thunks for cart operations
export const fetchCartItems = createAsyncThunk(
  'cart/fetchItems',
  async (userId, { rejectWithValue }) => {
    try {
      const items = await db.getCartItems(userId);
      return items;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addItemToCart = createAsyncThunk(
  'cart/addItem',
  async ({ userId, productId, quantity }, { rejectWithValue }) => {
    try {
      await db.addToCart(userId, productId, quantity);
      const updatedItems = await db.getCartItems(userId);
      return updatedItems;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateCartItemQuantity = createAsyncThunk(
  'cart/updateQuantity',
  async ({ userId, productId, quantity }, { rejectWithValue }) => {
    try {
      await db.updateCartItem(userId, productId, quantity);
      const updatedItems = await db.getCartItems(userId);
      return updatedItems;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const removeItemFromCart = createAsyncThunk(
  'cart/removeItem',
  async ({ userId, productId }, { rejectWithValue }) => {
    try {
      await db.removeFromCart(userId, productId);
      const updatedItems = await db.getCartItems(userId);
      return updatedItems;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const clearCart = createAsyncThunk(
  'cart/clear',
  async (userId, { rejectWithValue }) => {
    try {
      await db.clearCart(userId);
      return [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Load local cart from localStorage
const loadLocalCart = () => {
  try {
    const savedCart = localStorage.getItem('blinkit_local_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  } catch (error) {
    console.error('Error loading local cart:', error);
    return [];
  }
};

// Save local cart to localStorage
const saveLocalCart = (localItems) => {
  try {
    localStorage.setItem('blinkit_local_cart', JSON.stringify(localItems));
  } catch (error) {
    console.error('Error saving local cart:', error);
  }
};

const initialState = {
  items: [],
  loading: false,
  error: null,
  totalItems: 0,
  totalAmount: 0,
  isOpen: false,
  localItems: loadLocalCart(), // Load from localStorage on init
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    toggleCart: (state) => {
      state.isOpen = !state.isOpen;
    },
    openCart: (state) => {
      state.isOpen = true;
    },
    closeCart: (state) => {
      state.isOpen = false;
    },
    calculateTotals: (state) => {
      const allItems = [...state.items, ...state.localItems];
      state.totalItems = allItems.reduce((total, item) => total + item.quantity, 0);
      state.totalAmount = allItems.reduce(
        (total, item) => {
          const price = item.products?.price || item.product?.price || item.price || 0;
          return total + price * item.quantity;
        },
        0
      );
    },
    // Local cart actions for guest users
    addLocalItem: (state, action) => {
      const { product, quantity } = action.payload;
      const existingItem = state.localItems.find(item => item.product_id === product.id);
      
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        state.localItems.push({
          product_id: product.id,
          quantity,
          price: product.price,
          product: {
            id: product.id,
            name: product.name,
            price: product.price,
            image_url: product.image_url || product.image,
            unit: product.unit || product.quantity
          }
        });
      }
      saveLocalCart(state.localItems);
      cartSlice.caseReducers.calculateTotals(state);
    },
    
    incrementLocalItem: (state, action) => {
      const { productId } = action.payload;
      const item = state.localItems.find(item => item.product_id === productId);
      
      if (item) {
        item.quantity += 1;
        saveLocalCart(state.localItems);
        cartSlice.caseReducers.calculateTotals(state);
      }
    },
    
    decrementLocalItem: (state, action) => {
      const { productId } = action.payload;
      const item = state.localItems.find(item => item.product_id === productId);
      
      if (item) {
        if (item.quantity <= 1) {
          state.localItems = state.localItems.filter(item => item.product_id !== productId);
        } else {
          item.quantity -= 1;
        }
        saveLocalCart(state.localItems);
        cartSlice.caseReducers.calculateTotals(state);
      }
    },
    updateLocalItem: (state, action) => {
      const { productId, quantity } = action.payload;
      const item = state.localItems.find(item => item.product_id === productId);
      
      if (item) {
        if (quantity <= 0) {
          state.localItems = state.localItems.filter(item => item.product_id !== productId);
        } else {
          item.quantity = quantity;
        }
      }
      saveLocalCart(state.localItems);
      cartSlice.caseReducers.calculateTotals(state);
    },
    removeLocalItem: (state, action) => {
      const { productId } = action.payload;
      state.localItems = state.localItems.filter(item => item.product_id !== productId);
      saveLocalCart(state.localItems);
      cartSlice.caseReducers.calculateTotals(state);
    },
    clearLocalCart: (state) => {
      state.localItems = [];
      saveLocalCart(state.localItems);
      cartSlice.caseReducers.calculateTotals(state);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Cart Items
      .addCase(fetchCartItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCartItems.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        cartSlice.caseReducers.calculateTotals(state);
      })
      .addCase(fetchCartItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add Item to Cart
      .addCase(addItemToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addItemToCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        cartSlice.caseReducers.calculateTotals(state);
      })
      .addCase(addItemToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Cart Item Quantity
      .addCase(updateCartItemQuantity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCartItemQuantity.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        cartSlice.caseReducers.calculateTotals(state);
      })
      .addCase(updateCartItemQuantity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Remove Item from Cart
      .addCase(removeItemFromCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeItemFromCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        cartSlice.caseReducers.calculateTotals(state);
      })
      .addCase(removeItemFromCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Clear Cart
      .addCase(clearCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.totalItems = 0;
        state.totalAmount = 0;
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, toggleCart, openCart, closeCart, calculateTotals, addLocalItem, updateLocalItem, removeLocalItem, clearLocalCart, incrementLocalItem, decrementLocalItem } = cartSlice.actions;
export default cartSlice.reducer;
