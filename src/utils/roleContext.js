// Role context management for separating user and delivery agent sessions
const ROLE_CONTEXT_KEY = 'blinkit_role_context';

export const ROLES = {
  USER: 'user',
  DELIVERY_AGENT: 'delivery_agent'
};

// Set the current role context for this tab/session
export const setRoleContext = (role) => {
  if (!Object.values(ROLES).includes(role)) {
    // Invalid role
    return;
  }
  
  sessionStorage.setItem(ROLE_CONTEXT_KEY, role);
  // Role context set
};

// Get the current role context for this tab/session
export const getRoleContext = () => {
  return sessionStorage.getItem(ROLE_CONTEXT_KEY);
};

// Clear the role context
export const clearRoleContext = () => {
  sessionStorage.removeItem(ROLE_CONTEXT_KEY);
  // Role context cleared
};

// Check if current context matches a specific role
export const isCurrentRole = (role) => {
  return getRoleContext() === role;
};

// Check if user should access delivery agent features
export const canAccessDeliveryFeatures = () => {
  return isCurrentRole(ROLES.DELIVERY_AGENT);
};

// Check if user should access regular user features
export const canAccessUserFeatures = () => {
  return isCurrentRole(ROLES.USER) || !getRoleContext();
};
