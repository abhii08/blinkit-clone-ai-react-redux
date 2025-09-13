// Custom hook for handling logout functionality
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { clearUser } from '../../redux/slices/authSlice';
import { clearCart } from '../../redux/slices/cartSlice';
import { performLogout, performCompleteLogout } from '../utils/authHelpers';

export const useLogout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Standard logout - clears current tab only
  const logout = async () => {
    try {
      const result = await performLogout(dispatch, clearUser);
      
      if (result.success) {
        // Clear cart data
        dispatch(clearCart());
        
        // Navigate to role selection page
        navigate('/', { replace: true });
        
        return { success: true };
      } else {
        console.error('Logout failed:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  };

  // Complete logout - clears all tabs
  const logoutFromAllTabs = async () => {
    try {
      const result = await performCompleteLogout(dispatch, clearUser);
      
      if (result.success) {
        // Clear cart data
        dispatch(clearCart());
        
        // Navigate to role selection page
        navigate('/', { replace: true });
        
        return { success: true };
      } else {
        console.error('Complete logout failed:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Complete logout error:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    logout,
    logoutFromAllTabs
  };
};
