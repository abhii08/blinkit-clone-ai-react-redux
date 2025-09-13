// Role-based authentication hook that provides isolated auth state per tab
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getRoleContext } from '../utils/roleContext';
import { getStoredTabUser, getTabUser, clearTabAuthState } from '../utils/tabAuthManager';

export const useRoleBasedAuth = () => {
  const globalUser = useSelector(state => state.auth.user);
  const globalAuth = useSelector(state => state.auth.isAuthenticated);
  const sessionChecked = useSelector(state => state.auth.sessionChecked);
  
  const [effectiveUser, setEffectiveUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      const roleContext = getRoleContext();
      
      // Wait for session to be checked before proceeding
      if (!sessionChecked) {
        setIsLoading(true);
        return;
      }
      
      console.log('useRoleBasedAuth - Role context:', roleContext);
      console.log('useRoleBasedAuth - Global user:', globalUser?.email);
      
      let tabUser = null;
      if (roleContext) {
        // First check stored user for this role
        tabUser = getStoredTabUser();
        
        // If no stored user but we have global user, use it
        if (!tabUser && globalUser) {
          tabUser = getTabUser(globalUser);
        }
      }
      
      console.log('useRoleBasedAuth - Final tab user:', tabUser?.email);
      
      setEffectiveUser(tabUser);
      setIsAuthenticated(!!tabUser);
      setIsLoading(false);
    };

    initializeAuth();
  }, [globalUser, sessionChecked]);

  // Clear tab auth state when signing out
  const clearCurrentTabAuth = () => {
    clearTabAuthState();
    setEffectiveUser(null);
    setIsAuthenticated(false);
  };

  return {
    user: effectiveUser,
    isAuthenticated,
    isLoading,
    globalUser,
    globalAuth,
    clearCurrentTabAuth,
    roleContext: getRoleContext()
  };
};
