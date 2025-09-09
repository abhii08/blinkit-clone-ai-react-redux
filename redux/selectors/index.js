// Auth Selectors
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;
export const selectAuthInitialized = (state) => state.auth.initialized;

// Cart Selectors
export const selectCart = (state) => state.cart;
export const selectCartItems = (state) => state.cart.items;
export const selectCartLoading = (state) => state.cart.loading;
export const selectCartError = (state) => state.cart.error;
export const selectCartTotalItems = (state) => state.cart.totalItems;
export const selectCartTotalAmount = (state) => state.cart.totalAmount;
export const selectIsCartOpen = (state) => state.cart.isOpen;

// Location Selectors
export const selectLocation = (state) => state.location;
export const selectCurrentLocation = (state) => state.location.currentLocation;
export const selectSelectedAddress = (state) => state.location.selectedAddress;
export const selectUserAddresses = (state) => state.location.addresses;
export const selectNearbyStores = (state) => state.location.nearbyStores;
export const selectLocationLoading = (state) => state.location.loading;
export const selectLocationError = (state) => state.location.error;
export const selectIsLocationSelectorOpen = (state) => state.location.isLocationSelectorOpen;
export const selectLocationPermission = (state) => state.location.locationPermission;

// Products Selectors
export const selectProducts = (state) => state.products;
export const selectCategories = (state) => state.products.categories;
export const selectAllProducts = (state) => state.products.products;
export const selectProductsByCategory = (state) => state.products.productsByCategory;
export const selectSearchResults = (state) => state.products.searchResults;
export const selectProductsLoading = (state) => state.products.loading;
export const selectProductsError = (state) => state.products.error;
export const selectSearchTerm = (state) => state.products.searchTerm;
export const selectHasMoreProducts = (state) => state.products.hasMore;
export const selectCurrentPage = (state) => state.products.currentPage;

// Specific category selectors
export const selectDairyProducts = (state) => state.products.productsByCategory['dairy-bread-eggs'];
export const selectSweetToothProducts = (state) => state.products.productsByCategory['sweet-tooth'];
export const selectSnacksProducts = (state) => state.products.productsByCategory['snacks-munchies'];
export const selectDrinksProducts = (state) => state.products.productsByCategory['cold-drinks-juices'];

// UI Selectors
export const selectUI = (state) => state.ui;
export const selectModals = (state) => state.ui.modals;
export const selectAuthModal = (state) => state.ui.modals.auth;
export const selectLocationSelectorModal = (state) => state.ui.modals.locationSelector;
export const selectUILoading = (state) => state.ui.loading;
export const selectNotifications = (state) => state.ui.notifications;
export const selectTheme = (state) => state.ui.theme;
export const selectMobileMenuOpen = (state) => state.ui.mobileMenuOpen;
export const selectSearchFocused = (state) => state.ui.searchFocused;

// Combined/Computed Selectors
export const selectIsAppLoading = (state) => {
  return state.auth.loading || 
         state.cart.loading || 
         state.location.loading || 
         state.products.loading.categories ||
         state.ui.loading.app;
};

export const selectHasAnyError = (state) => {
  return !!(state.auth.error || 
           state.cart.error || 
           state.location.error || 
           Object.values(state.products.error).some(error => error));
};

export const selectCartItemById = (state, productId) => {
  return state.cart.items.find(item => item.product_id === productId);
};

export const selectAddressById = (state, addressId) => {
  return state.location.addresses.find(address => address.id === addressId);
};

export const selectCategoryBySlug = (state, slug) => {
  return state.products.categories.find(category => category.slug === slug);
};
