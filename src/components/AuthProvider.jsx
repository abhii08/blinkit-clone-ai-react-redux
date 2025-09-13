import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { supabase } from '../lib/supabase';
import { setUser, clearUser } from '../../redux/slices/authSlice';
import { getRoleContext } from '../utils/roleContext';
import { storeTabAuthState, getStoredTabUser, clearTabAuthState, validateStoredAuth } from '../utils/tabAuthManager';

// Authentication Provider Component - handles auth persistence on app startup
const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const sessionChecked = useSelector(state => state.auth.sessionChecked);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('AuthProvider: Initializing authentication...');
        
        // Get current Supabase session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthProvider: Error getting session:', error);
          if (mounted) dispatch(clearUser());
          return;
        }

        const roleContext = getRoleContext();
        console.log('AuthProvider: Role context:', roleContext, 'Session user:', session?.user?.email);
        
        if (session?.user) {
          // We have a valid Supabase session
          if (roleContext) {
            // Validate against stored tab auth
            const isValid = await validateStoredAuth(session);
            
            if (isValid) {
              console.log('AuthProvider: Restoring valid auth state');
              if (mounted) {
                dispatch(setUser(session.user));
                storeTabAuthState({
                  user: session.user,
                  isAuthenticated: true
                });
              }
            } else {
              console.log('AuthProvider: Invalid stored auth, clearing state');
              if (mounted) dispatch(clearUser());
            }
          } else {
            // No role context - clear Redux state but keep Supabase session
            console.log('AuthProvider: No role context, clearing Redux state');
            if (mounted) dispatch(clearUser());
          }
        } else {
          // No session - clear any stale stored auth
          const storedUser = getStoredTabUser();
          if (storedUser) {
            console.log('AuthProvider: No session but stored user found, clearing');
            clearTabAuthState();
          }
          if (mounted) dispatch(clearUser());
        }
      } catch (error) {
        console.error('AuthProvider: Error initializing auth:', error);
        if (mounted) dispatch(clearUser());
      }
    };

    // Only initialize if session hasn't been checked yet
    if (!sessionChecked) {
      initializeAuth();
    }

    return () => {
      mounted = false;
    };
  }, [dispatch, sessionChecked]);

  return children;
};

export default AuthProvider;
