import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { supabase } from '../lib/supabase';
import { setUser, clearUser, getCurrentUser } from '../../redux/slices/authSlice';
import { fetchCartItems } from '../../redux/slices/cartSlice';
import { getRoleContext, ROLES } from '../utils/roleContext';
import { storeTabAuthState, getStoredTabUser, clearTabAuthState } from '../utils/tabAuthManager';

// Custom hook to handle authentication session management
export const useAuthSession = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Initialize authentication state on app startup
    const initializeAuth = async () => {
      try {
        console.log('Initializing authentication...');
        
        // First, check if we have a valid Supabase session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          dispatch(clearUser());
          return;
        }

        const roleContext = getRoleContext();
        console.log('Role context:', roleContext, 'Session user:', session?.user?.email);
        
        if (session?.user) {
          // We have a valid Supabase session
          if (roleContext) {
            // Check if this matches stored tab auth
            const storedUser = getStoredTabUser();
            
            if (!storedUser || storedUser.id === session.user.id) {
              // Either no stored user or same user - restore auth state
              console.log('Restoring auth state for user:', session.user.email);
              dispatch(setUser(session.user));
              storeTabAuthState({
                user: session.user,
                isAuthenticated: true
              });
              
              // Fetch cart items for user role
              if (roleContext === ROLES.USER) {
                dispatch(fetchCartItems(session.user.id));
              }
            } else {
              // Different user stored - clear state
              console.log('Different user in session, clearing state');
              dispatch(clearUser());
            }
          } else {
            // No role context but valid session - clear Redux state
            console.log('No role context, clearing Redux state');
            dispatch(clearUser());
          }
        } else {
          // No session - check if we have stored auth that needs clearing
          const storedUser = getStoredTabUser();
          if (storedUser) {
            console.log('No session but stored user found, clearing stored state');
            clearTabAuthState();
          }
          dispatch(clearUser());
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        dispatch(clearUser());
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          console.log('Auth state changed:', event, session?.user?.email);
          const roleContext = getRoleContext();
          console.log('Auth change - Role context:', roleContext);
          
          switch (event) {
            case 'SIGNED_IN':
              console.log('User signed in:', session?.user?.email);
              if (session?.user && roleContext) {
                const storedUser = getStoredTabUser();
                
                if (!storedUser || storedUser.id === session.user.id) {
                  dispatch(setUser(session.user));
                  storeTabAuthState({
                    user: session.user,
                    isAuthenticated: true
                  });
                  
                  if (roleContext === ROLES.USER) {
                    dispatch(fetchCartItems(session.user.id));
                  }
                } else {
                  console.log('Different user signed in, clearing Redux state');
                  dispatch(clearUser());
                }
              } else if (!roleContext) {
                dispatch(clearUser());
              }
              break;
            case 'SIGNED_OUT':
              console.log('User signed out');
              dispatch(clearUser());
              clearTabAuthState();
              break;
            case 'TOKEN_REFRESHED':
              console.log('Token refreshed for user:', session?.user?.email);
              if (session?.user && roleContext) {
                const storedUser = getStoredTabUser();
                
                if (storedUser && storedUser.id === session.user.id) {
                  dispatch(setUser(session.user));
                  storeTabAuthState({
                    user: session.user,
                    isAuthenticated: true
                  });
                } else {
                  console.log('Token refresh mismatch, clearing state');
                  dispatch(clearUser());
                }
              } else if (!roleContext) {
                dispatch(clearUser());
              }
              break;
            case 'USER_UPDATED':
              console.log('User updated:', session?.user?.email);
              if (session?.user && roleContext) {
                const storedUser = getStoredTabUser();
                
                if (storedUser && storedUser.id === session.user.id) {
                  dispatch(setUser(session.user));
                  storeTabAuthState({
                    user: session.user,
                    isAuthenticated: true
                  });
                } else {
                  console.log('User update mismatch, clearing state');
                  dispatch(clearUser());
                }
              } else if (!roleContext) {
                dispatch(clearUser());
              }
              break;
            default:
              break;
          }
        } catch (error) {
          console.error('Error in auth state change handler:', error);
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
  const user = useSelector(state => state.auth.user);
  
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
