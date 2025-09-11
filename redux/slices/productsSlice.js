import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { db } from '../../src/lib/supabase';

// Async thunks for product operations
export const fetchCategories = createAsyncThunk(
  'products/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const categories = await db.getCategories();
      return categories;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch categories');
    }
  }
);

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async ({ categoryId = null, limit = 20, offset = 0 } = {}, { rejectWithValue }) => {
    try {
      const products = await db.getProducts(categoryId, limit, offset);
      return { products, categoryId, offset };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch products');
    }
  }
);

export const fetchProductsByCategory = createAsyncThunk(
  'products/fetchByCategory',
  async ({ categorySlug, limit = 6 }, { rejectWithValue }) => {
    try {
      const products = await db.getProductsByCategory(categorySlug, limit);
      return { products, categorySlug };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch products by category');
    }
  }
);

export const fetchAllProductsByCategory = createAsyncThunk(
  'products/fetchAllByCategory',
  async ({ categorySlug }, { rejectWithValue }) => {
    try {
      const products = await db.getAllProductsByCategory(categorySlug);
      return { products, categorySlug };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch all products by category');
    }
  }
);

export const searchProducts = createAsyncThunk(
  'products/search',
  async ({ searchTerm, limit = 20 }, { rejectWithValue }) => {
    try {
      const products = await db.searchProducts(searchTerm, limit);
      return { products, searchTerm };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to search products');
    }
  }
);

const initialState = {
  categories: [],
  products: [],
  productsByCategory: {},
  allProductsByCategory: {},
  searchResults: [],
  loading: {
    categories: false,
    products: false,
    productsByCategory: false,
    allProductsByCategory: false,
    search: false,
  },
  error: {
    categories: null,
    products: null,
    productsByCategory: null,
    allProductsByCategory: null,
    search: null,
  },
  searchTerm: '',
  hasMore: true,
  currentPage: 0,
};

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    clearErrors: (state) => {
      state.error = {
        categories: null,
        products: null,
        productsByCategory: null,
        allProductsByCategory: null,
        search: null,
      };
    },
    clearError: (state, action) => {
      const errorType = action.payload;
      if (state.error[errorType]) {
        state.error[errorType] = null;
      }
    },
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchTerm = '';
    },
    resetProducts: (state) => {
      state.products = [];
      state.currentPage = 0;
      state.hasMore = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Categories
      .addCase(fetchCategories.pending, (state) => {
        state.loading.categories = true;
        state.error.categories = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading.categories = false;
        state.categories = action.payload || [];
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading.categories = false;
        state.error.categories = action.payload;
        state.categories = []; // Prevent cascade errors
      })
      // Fetch Products
      .addCase(fetchProducts.pending, (state) => {
        state.loading.products = true;
        state.error.products = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading.products = false;
        const { products, offset } = action.payload;
        if (offset === 0) {
          state.products = products || [];
        } else {
          state.products = [...state.products, ...(products || [])];
        }
        state.hasMore = (products?.length || 0) === 20;
        state.currentPage = Math.floor(offset / 20) + 1;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading.products = false;
        state.error.products = action.payload;
      })
      // Fetch Products by Category
      .addCase(fetchProductsByCategory.pending, (state) => {
        state.loading.productsByCategory = true;
        state.error.productsByCategory = null;
      })
      .addCase(fetchProductsByCategory.fulfilled, (state, action) => {
        state.loading.productsByCategory = false;
        const { products, categorySlug } = action.payload;
        state.productsByCategory[categorySlug] = products || [];
      })
      .addCase(fetchProductsByCategory.rejected, (state, action) => {
        state.loading.productsByCategory = false;
        state.error.productsByCategory = action.payload;
      })
      // Fetch All Products by Category
      .addCase(fetchAllProductsByCategory.pending, (state) => {
        state.loading.allProductsByCategory = true;
        state.error.allProductsByCategory = null;
      })
      .addCase(fetchAllProductsByCategory.fulfilled, (state, action) => {
        state.loading.allProductsByCategory = false;
        const { products, categorySlug } = action.payload;
        state.allProductsByCategory[categorySlug] = products || [];
      })
      .addCase(fetchAllProductsByCategory.rejected, (state, action) => {
        state.loading.allProductsByCategory = false;
        state.error.allProductsByCategory = action.payload;
      })
      // Search Products
      .addCase(searchProducts.pending, (state) => {
        state.loading.search = true;
        state.error.search = null;
      })
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.loading.search = false;
        const { products, searchTerm } = action.payload;
        state.searchResults = products || [];
        state.searchTerm = searchTerm;
      })
      .addCase(searchProducts.rejected, (state, action) => {
        state.loading.search = false;
        state.error.search = action.payload;
        state.searchResults = []; // Prevent cascade errors
      });
  },
});

export const {
  clearErrors,
  clearError,
  setSearchTerm,
  clearSearchResults,
  resetProducts,
} = productsSlice.actions;

export default productsSlice.reducer;
