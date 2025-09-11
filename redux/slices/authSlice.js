import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { auth } from '../../src/lib/supabase';

// Async thunks for auth operations
export const signUpUser = createAsyncThunk(
  'auth/signUp',
  async ({ email, password, userData }, { rejectWithValue }) => {
    try {
      const data = await auth.signUp(email, password, userData);
      
      // If email confirmation is required, return the data with a specific message
      if (data?.requires_confirmation) {
        return { 
          user: data.user, 
          requiresConfirmation: true,
          message: data.message 
        };
      }
      
      return data;
    } catch (error) {
      // Handle specific error cases with better messages
      if (error.message.includes('already registered')) {
        return rejectWithValue('This email is already registered. Please sign in or reset your password.');
      }
      return rejectWithValue(error.message || 'Failed to sign up. Please try again.');
    }
  }
);

export const signInUser = createAsyncThunk(
  'auth/signIn',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const data = await auth.signIn(email, password);
      
      // Double-check if email is confirmed
      if (data?.user && !data.user.email_confirmed_at) {
        throw new Error('Please confirm your email before signing in.');
      }
      
      return data;
    } catch (error) {
      // Handle specific error cases with better messages
      if (error.message.includes('Email not confirmed')) {
        return rejectWithValue('Please confirm your email before signing in. Check your inbox for the confirmation email.');
      }
      if (error.message.includes('Invalid login credentials')) {
        return rejectWithValue('Invalid email or password. Please try again.');
      }
      if (error.message.includes('rate limit')) {
        return rejectWithValue('Too many attempts. Please try again later.');
      }
      return rejectWithValue(error.message || 'Failed to sign in. Please try again.');
    }
  }
);

export const signOutUser = createAsyncThunk(
  'auth/signOut',
  async (_, { rejectWithValue }) => {
    try {
      await auth.signOut();
      return null;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const user = await auth.getCurrentUser();
      return user;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'auth/updateProfile',
  async (updates, { rejectWithValue }) => {
    try {
      const data = await auth.updateProfile(updates);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  message: null,
  requiresConfirmation: false,
  initialized: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.message = null;
    },
    clearMessage: (state) => {
      state.message = null;
    },
    setRequiresConfirmation: (state, action) => {
      state.requiresConfirmation = action.payload;
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.initialized = true;
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Sign Up
      .addCase(signUpUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.requiresConfirmation = false;
      })
      .addCase(signUpUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = !!action.payload.user;
        state.requiresConfirmation = action.payload.requiresConfirmation || false;
        
        // If email confirmation is required, set a success message
        if (action.payload.requiresConfirmation && action.payload.message) {
          state.message = action.payload.message;
        }
      })
      .addCase(signUpUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.requiresConfirmation = false;
      })
      // Sign In
      .addCase(signInUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signInUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = !!action.payload.user;
      })
      .addCase(signInUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Sign Out
      .addCase(signOutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(signOutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(signOutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Current User
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = !!action.payload;
        state.initialized = true;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.initialized = true;
      })
      // Update Profile
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;
