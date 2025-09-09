import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Modal states
  modals: {
    auth: {
      isOpen: false,
      mode: 'login', // 'login' | 'signup'
    },
    locationSelector: {
      isOpen: false,
    },
  },
  // Loading states for UI components
  loading: {
    app: false,
    navbar: false,
    productSections: false,
  },
  // Notification/Toast system
  notifications: [],
  // Theme and UI preferences
  theme: 'light',
  // Mobile menu state
  mobileMenuOpen: false,
  // Search bar state
  searchFocused: false,
  // Pending action for post-login execution
  pendingAction: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Modal actions
    openAuthModal: (state, action) => {
      state.modals.auth.isOpen = true;
      state.modals.auth.mode = action.payload || 'login';
    },
    closeAuthModal: (state) => {
      state.modals.auth.isOpen = false;
    },
    setAuthMode: (state, action) => {
      state.modals.auth.mode = action.payload;
    },
    openLocationSelector: (state) => {
      state.modals.locationSelector.isOpen = true;
    },
    closeLocationSelector: (state) => {
      state.modals.locationSelector.isOpen = false;
    },
    
    // Loading actions
    setAppLoading: (state, action) => {
      state.loading.app = action.payload;
    },
    setNavbarLoading: (state, action) => {
      state.loading.navbar = action.payload;
    },
    setProductSectionsLoading: (state, action) => {
      state.loading.productSections = action.payload;
    },
    
    // Notification actions
    addNotification: (state, action) => {
      const notification = {
        id: Date.now() + Math.random(),
        type: 'info', // 'success' | 'error' | 'warning' | 'info'
        title: '',
        message: '',
        duration: 5000,
        ...action.payload,
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    
    // Theme actions
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
    
    // Mobile menu actions
    toggleMobileMenu: (state) => {
      state.mobileMenuOpen = !state.mobileMenuOpen;
    },
    closeMobileMenu: (state) => {
      state.mobileMenuOpen = false;
    },
    
    // Search actions
    setSearchFocused: (state, action) => {
      state.searchFocused = action.payload;
    },
    
    // Pending action management
    setPendingAction: (state, action) => {
      state.pendingAction = action.payload;
    },
    clearPendingAction: (state) => {
      state.pendingAction = null;
    },
  },
});

export const {
  // Modal actions
  openAuthModal,
  closeAuthModal,
  setAuthMode,
  openLocationSelector,
  closeLocationSelector,
  
  // Loading actions
  setAppLoading,
  setNavbarLoading,
  setProductSectionsLoading,
  
  // Notification actions
  addNotification,
  removeNotification,
  clearNotifications,
  
  // Theme actions
  setTheme,
  toggleTheme,
  
  // Mobile menu actions
  toggleMobileMenu,
  closeMobileMenu,
  
  // Search actions
  setSearchFocused,
  
  // Pending action actions
  setPendingAction,
  clearPendingAction,
} = uiSlice.actions;

export default uiSlice.reducer;
