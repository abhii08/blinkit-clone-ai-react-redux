import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { supabase } from '../lib/supabase';
import { setUser, clearUser } from '../../redux/slices/authSlice';
import { fetchCartItems } from '../../redux/slices/cartSlice';

// Custom hook to handle authentication session management
export const useAuthSession = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting session:', error);
        return;
      }
      
      if (session?.user) {
        dispatch(setUser(session.user));
        // Fetch cart items for authenticated user
        dispatch(fetchCartItems(session.user.id));
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        switch (event) {
          case 'SIGNED_IN':
            if (session?.user) {
              dispatch(setUser(session.user));
              // Fetch cart items for newly signed in user
              dispatch(fetchCartItems(session.user.id));
            }
            break;
          case 'SIGNED_OUT':
            dispatch(clearUser());
            break;
          case 'TOKEN_REFRESHED':
            if (session?.user) {
              dispatch(setUser(session.user));
            }
            break;
          case 'USER_UPDATED':
            if (session?.user) {
              dispatch(setUser(session.user));
            }
            break;
          default:
            break;
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, [dispatch]);
};

// Hook for checking if user has specific permissions
export const usePermissions = () => {
  const { user } = useAuth();
  
  const hasRole = (role) => {
    return user?.user_metadata?.role === role || user?.app_metadata?.role === role;
  };
  
  const isAdmin = () => hasRole('admin');
  const isDeliveryPartner = () => hasRole('delivery_partner');
  const isCustomer = () => hasRole('customer') || !user?.user_metadata?.role;
  
  return {
    hasRole,
    isAdmin,
    isDeliveryPartner,
    isCustomer,
  };
};
