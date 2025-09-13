// Tab-specific authentication manager to completely isolate auth states
import { getRoleContext, ROLES } from './roleContext';

const USER_AUTH_KEY = 'blinkit_user_auth_state';
const DELIVERY_AUTH_KEY = 'blinkit_delivery_auth_state';

// Get the appropriate auth key based on current role context
const getAuthKey = () => {
  const role = getRoleContext();
  return role === ROLES.DELIVERY_AGENT ? DELIVERY_AUTH_KEY : USER_AUTH_KEY;
};

// Store authentication state for specific role in this tab
export const storeTabAuthState = (authState) => {
  const authKey = getAuthKey();
  sessionStorage.setItem(authKey, JSON.stringify({
    ...authState,
    timestamp: Date.now(),
    role: getRoleContext()
  }));
};

// Get authentication state for current role context in this tab
export const getTabAuthState = () => {
  const authKey = getAuthKey();
  const authData = sessionStorage.getItem(authKey);
  
  if (!authData) return null;
  
  try {
    return JSON.parse(authData);
  } catch (error) {
    // Error parsing tab auth state
    return null;
  }
};

// Clear authentication state for current role context
export const clearTabAuthState = () => {
  const authKey = getAuthKey();
  sessionStorage.removeItem(authKey);
};

// Clear all authentication states
export const clearAllTabAuthStates = () => {
  sessionStorage.removeItem(USER_AUTH_KEY);
  sessionStorage.removeItem(DELIVERY_AUTH_KEY);
};

// Check if current tab should show authenticated user
export const getTabUser = (globalUser) => {
  const roleContext = getRoleContext();
  
  // If no role context, return null (not authenticated for this tab)
  if (!roleContext) return null;
  
  // Get stored auth state for this tab/role
  const tabAuthState = getTabAuthState();
  
  // If we have tab auth state and it matches current role, use it
  if (tabAuthState && tabAuthState.role === roleContext && tabAuthState.user) {
    // Using stored tab auth state
    return tabAuthState.user;
  }
  
  // If we have a global user and role context, store it
  if (globalUser && roleContext) {
    // Storing global user for role
    storeTabAuthState({
      user: globalUser,
      isAuthenticated: true
    });
    return globalUser;
  }
  
  // No valid auth state found
  return null;
};

// Get user from tab auth state without requiring global user (for page refresh scenarios)
export const getStoredTabUser = () => {
  const roleContext = getRoleContext();
  
  if (!roleContext) {
    return null;
  }
  
  // Get auth state specifically for current role context
  const authKey = roleContext === ROLES.DELIVERY_AGENT ? DELIVERY_AUTH_KEY : USER_AUTH_KEY;
  const authData = sessionStorage.getItem(authKey);
  
  if (!authData) {
    return null;
  }
  
  try {
    const tabAuthState = JSON.parse(authData);
    
    // Check if stored data is valid and matches current role
    if (tabAuthState && 
        tabAuthState.role === roleContext && 
        tabAuthState.user && 
        tabAuthState.isAuthenticated) {
      
      // Check if stored data is not too old (optional: add timestamp validation)
      const now = Date.now();
      const storedTime = tabAuthState.timestamp || 0;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (now - storedTime > maxAge) {
        // Stored auth data expired, clearing
        sessionStorage.removeItem(authKey);
        return null;
      }
      
      // Retrieved valid stored user
      return tabAuthState.user;
    }
  } catch (error) {
    // Error parsing stored auth data
    sessionStorage.removeItem(authKey);
  }
  
  return null;
};

// Check if current tab should show authenticated state
export const isTabAuthenticated = () => {
  const user = getStoredTabUser();
  return !!user;
};

// Validate stored auth state against current session
export const validateStoredAuth = async (supabaseSession) => {
  const storedUser = getStoredTabUser();
  
  if (!storedUser) return false;
  
  // If we have both stored user and session, they should match
  if (supabaseSession?.user) {
    return storedUser.id === supabaseSession.user.id;
  }
  
  // If no session but we have stored user, it's invalid
  if (!supabaseSession?.user && storedUser) {
    clearTabAuthState();
    return false;
  }
  
  return true;
};
