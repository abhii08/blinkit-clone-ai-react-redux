import { addNotification } from '../slices/uiSlice';

// Error handling middleware to prevent cascade errors
export const errorHandlerMiddleware = (store) => (next) => (action) => {
  try {
    return next(action);
  } catch (error) {
    console.error('Redux Error:', error);
    
    // Dispatch error notification
    store.dispatch(addNotification({
      type: 'error',
      title: 'Application Error',
      message: 'Something went wrong. Please try again.',
      duration: 5000,
    }));
    
    // Prevent cascade by returning a safe action
    return {
      type: 'ERROR_HANDLED',
      payload: error.message,
    };
  }
};

// Async error handler for thunks
export const asyncErrorHandler = (store) => (next) => (action) => {
  if (action.type.endsWith('/rejected')) {
    const errorMessage = action.payload || 'An error occurred';
    
    // Don't show notifications for auth initialization errors
    if (!action.type.includes('getCurrentUser')) {
      store.dispatch(addNotification({
        type: 'error',
        title: 'Error',
        message: errorMessage,
        duration: 4000,
      }));
    }
  }
  
  return next(action);
};
