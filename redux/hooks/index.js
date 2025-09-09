import { useSelector, useDispatch } from 'react-redux';
import { useMemo } from 'react';

// Typed hooks for better TypeScript support and consistency
export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;

// Custom hooks for common Redux patterns
export const useAuth = () => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);
  
  return useMemo(() => ({
    ...auth,
    dispatch,
  }), [auth, dispatch]);
};

export const useCart = () => {
  const dispatch = useAppDispatch();
  const cart = useAppSelector((state) => state.cart);
  
  return useMemo(() => ({
    ...cart,
    dispatch,
  }), [cart, dispatch]);
};

export const useLocation = () => {
  const dispatch = useAppDispatch();
  const location = useAppSelector((state) => state.location);
  
  return useMemo(() => ({
    ...location,
    dispatch,
  }), [location, dispatch]);
};

export const useProducts = () => {
  const dispatch = useAppDispatch();
  const products = useAppSelector((state) => state.products);
  
  return useMemo(() => ({
    ...products,
    dispatch,
  }), [products, dispatch]);
};

export const useUI = () => {
  const dispatch = useAppDispatch();
  const ui = useAppSelector((state) => state.ui);
  
  return useMemo(() => ({
    ...ui,
    dispatch,
  }), [ui, dispatch]);
};
