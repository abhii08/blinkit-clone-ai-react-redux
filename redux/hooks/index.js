import { useSelector, useDispatch } from 'react-redux';
import { useMemo } from 'react';

// Typed hooks for better TypeScript support and consistency
export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;

// Custom hooks for common Redux patterns

// Auth hooks
export const useAuth = () => {
  const auth = useSelector(state => state.auth);
  const dispatch = useDispatch();
  return { ...auth, dispatch };
};

// Cart hooks
export const useCart = () => {
  const cart = useSelector(state => state.cart);
  const dispatch = useDispatch();
  return { ...cart, dispatch };
};

// Location hooks
export const useLocation = () => {
  const location = useSelector(state => state.location);
  const dispatch = useDispatch();
  return { ...location, dispatch };
};

// Products hooks
export const useProducts = () => {
  const products = useSelector(state => state.products);
  const dispatch = useDispatch();
  return { ...products, dispatch };
};

// UI hooks
export const useUI = () => {
  const ui = useSelector(state => state.ui);
  const dispatch = useDispatch();
  return { ...ui, dispatch };
};

// Order hooks
export const useOrder = () => {
  const order = useSelector(state => state.order);
  const dispatch = useDispatch();
  return { ...order, dispatch };
};

// Delivery hooks
export const useDelivery = () => {
  const delivery = useSelector(state => state.delivery);
  const dispatch = useDispatch();
  return { ...delivery, dispatch };
};
