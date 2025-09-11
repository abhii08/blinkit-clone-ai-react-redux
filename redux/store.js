import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import cartSlice from './slices/cartSlice';
import locationSlice from './slices/locationSlice';
import productsSlice from './slices/productsSlice';
import uiSlice from './slices/uiSlice';
import orderSlice from './slices/orderSlice';
import deliverySlice from './slices/deliverySlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    cart: cartSlice,
    location: locationSlice,
    products: productsSlice,
    ui: uiSlice,
    order: orderSlice,
    delivery: deliverySlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});