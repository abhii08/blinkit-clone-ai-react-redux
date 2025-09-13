// Authentication helper functions
import { supabase } from '../lib/supabase';
import { clearTabAuthState, clearAllTabAuthStates } from './tabAuthManager';
import { clearRoleContext } from './roleContext';

// Enhanced logout function that properly cleans up all auth states
export const performLogout = async (dispatch, clearUserAction) => {
  try {
    // Performing complete logout
    
    // 1. Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    if (error) {
      // Error signing out from Supabase - continue with cleanup
    }
    
    // 2. Clear Redux auth state
    dispatch(clearUserAction());
    
    // 3. Clear current tab auth state
    clearTabAuthState();
    
    // 4. Clear role context for this tab
    clearRoleContext();
    
    // Logout completed successfully
    return { success: true };
  } catch (error) {
    // Error during logout
    
    // Even if there's an error, try to clean up local state
    dispatch(clearUserAction());
    clearTabAuthState();
    clearRoleContext();
    
    return { success: false, error: error.message };
  }
};

// Complete logout that clears all tabs (for when user wants to sign out completely)
export const performCompleteLogout = async (dispatch, clearUserAction) => {
  try {
    // Performing complete logout for all tabs
    
    // 1. Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    if (error) {
      // Error signing out from Supabase
    }
    
    // 2. Clear Redux auth state
    dispatch(clearUserAction());
    
    // 3. Clear all tab auth states
    clearAllTabAuthStates();
    
    // 4. Clear role context for this tab
    clearRoleContext();
    
    // Complete logout finished
    return { success: true };
  } catch (error) {
    // Error during complete logout
    
    // Cleanup local state even if there's an error
    dispatch(clearUserAction());
    clearAllTabAuthStates();
    clearRoleContext();
    
    return { success: false, error: error.message };
  }
};

// Check if user is authenticated for current role context
export const isAuthenticatedForRole = (authState, roleContext) => {
  if (!roleContext) return false;
  return authState.isAuthenticated && authState.user && authState.sessionChecked;
};

// Get user display name
export const getUserDisplayName = (user) => {
  if (!user) return 'User';
  
  return user.user_metadata?.full_name || 
         user.user_metadata?.name || 
         user.email?.split('@')[0] || 
         'User';
};

// Check if user has specific role
export const hasUserRole = (user, role) => {
  if (!user) return false;
  
  return user.user_metadata?.role === role || 
         user.app_metadata?.role === role;
};

// Validate session and return user info
export const validateSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      // Session validation error
      return { valid: false, error: error.message };
    }
    
    if (!session?.user) {
      return { valid: false, error: 'No active session' };
    }
    
    return { 
      valid: true, 
      user: session.user,
      session: session
    };
  } catch (error) {
    // Session validation failed
    return { valid: false, error: error.message };
  }
};
