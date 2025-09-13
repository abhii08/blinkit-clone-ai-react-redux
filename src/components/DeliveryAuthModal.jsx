import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { signInUser, clearError } from '../../redux/slices/authSlice';
import { supabase } from '../lib/supabase';
import { validation, authRateLimiter, getPasswordStrength } from '../utils/validation';
import { storeTabAuthState } from '../utils/tabAuthManager';

const DeliveryAuthModal = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    confirmPassword: '',
    vehicleType: 'bike',
    vehicleNumber: ''
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const validateForm = () => {
    const errors = {};
    
    // Email validation
    const emailError = validation.email(formData.email);
    if (emailError) errors.email = emailError;

    // Simplified password validation for delivery agents
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }

    if (mode === 'signup') {
      // Full name validation
      if (!formData.fullName.trim()) {
        errors.fullName = 'Full name is required';
      }

      // Phone validation
      const phoneError = validation.phone(formData.phone);
      if (phoneError) errors.phone = phoneError;

      // Confirm password validation
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }

      // Vehicle number validation
      if (!formData.vehicleNumber.trim()) {
        errors.vehicleNumber = 'Vehicle number is required';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Update password strength for signup
    if (name === 'password' && mode === 'signup') {
      setPasswordStrength(getPasswordStrength(value));
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      fullName: '',
      phone: '',
      confirmPassword: '',
      vehicleType: 'bike',
      vehicleNumber: ''
    });
    setValidationErrors({});
    setPasswordStrength(null);
  };

  const toggleMode = () => {
    setMode(prevMode => prevMode === 'login' ? 'signup' : 'login');
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Rate limiting check
    const rateLimitResult = authRateLimiter.isAllowed(formData.email);
    if (!rateLimitResult.allowed) {
      setIsRateLimited(true);
      setTimeout(() => setIsRateLimited(false), rateLimitResult.resetTime * 60 * 1000);
      return;
    }

    setIsSubmitting(true);
    dispatch(clearError());

    try {
      if (mode === 'login') {
        // Handle login
        const signInResult = await dispatch(signInUser({ 
          email: formData.email, 
          password: formData.password 
        }));

        if (signInResult.error) {
          throw new Error(signInResult.error.message || 'Login failed');
        }

        const { user, session } = signInResult.payload;

        // Check if user is a delivery agent
        const { data: agentData, error: agentError } = await supabase
          .from('delivery_agents')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (agentError || !agentData) {
          // Don't sign out - just show error message
          // The user might be valid but not a delivery agent
          throw new Error('No delivery agent profile found. Please sign up as a delivery agent first.');
        }

        // Store the user in tab auth state for delivery agent role
        storeTabAuthState({
          user,
          isAuthenticated: true
        });
        
        onSuccess(user, agentData);
      } else {
        // Handle signup
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
              phone: formData.phone,
              user_type: 'delivery_agent'
            }
          }
        });

        if (signUpError) {
          // Handle specific signup errors
          if (signUpError.message.includes('already registered')) {
            throw new Error('An account with this email already exists. Please try logging in instead.');
          }
          throw signUpError;
        }
        
        if (!signUpData.user) throw new Error('Failed to create user');

        // Check if email confirmation is required
        if (!signUpData.session) {
          // Email confirmation required - but still create the agent profile
        }

        // Create delivery agent profile
        const { data: agentData, error: agentError } = await supabase
          .from('delivery_agents')
          .insert({
            user_id: signUpData.user.id,
            full_name: formData.fullName,
            phone: formData.phone,
            email: formData.email,
            vehicle_type: formData.vehicleType,
            vehicle_number: formData.vehicleNumber,
            status: 'offline',
            is_active: true,
            is_verified: false
          })
          .select()
          .single();

        // Agent creation result processed

        if (agentError) {
          // Database error creating agent profile
          // Handle database constraint errors
          if (agentError.code === '23505') {
            throw new Error('A delivery agent profile already exists for this account.');
          }
          throw new Error(`Failed to create delivery agent profile: ${agentError.message}`);
        }

        if (!agentData) {
          throw new Error('Agent profile was not created successfully');
        }

        // Successfully created agent profile
        
        // Handle different scenarios based on email confirmation
        if (!signUpData.session) {
          // Email confirmation required - show success message but don't call onSuccess yet
          dispatch({
            type: 'auth/setError',
            payload: 'Account created successfully! Please check your email to confirm your account, then log in.'
          });
          // Reset form and close modal
          resetForm();
          setTimeout(() => {
            onClose();
          }, 3000);
        } else {
          // No email confirmation needed - proceed normally
          // Store the user in tab auth state for delivery agent role
          storeTabAuthState({
            user: signUpData.user,
            isAuthenticated: true
          });
          
          onSuccess(signUpData.user, agentData);
        }
      }
    } catch (error) {
      // Authentication error
      // Set error in Redux state
      dispatch({
        type: 'auth/setError',
        payload: error.message || 'An error occurred during authentication'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {mode === 'login' ? 'Delivery Agent Login' : 'Delivery Agent Sign Up'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isSubmitting}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isRateLimited && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-600 text-sm">Too many attempts. Please wait a minute.</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'login' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md ${validationErrors.email ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Enter your email"
                  required
                />
                {validationErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md ${validationErrors.password ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Enter your password"
                  required
                />
                {validationErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
                )}
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md ${validationErrors.fullName ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Enter your full name"
                  required
                />
                {validationErrors.fullName && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.fullName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md ${validationErrors.email ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Enter your email"
                  required
                />
                {validationErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md ${validationErrors.phone ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter phone number"
                    required
                  />
                  {validationErrors.phone && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                  <select
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="bike">Bike</option>
                    <option value="scooter">Scooter</option>
                    <option value="bicycle">Bicycle</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
                <input
                  type="text"
                  name="vehicleNumber"
                  value={formData.vehicleNumber}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md ${validationErrors.vehicleNumber ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Enter vehicle number"
                  required
                />
                {validationErrors.vehicleNumber && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.vehicleNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md ${validationErrors.password ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Create a password"
                  required
                />
                {passwordStrength && (
                  <div className="mt-1">
                    <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${passwordStrength.score > 2 ? 'bg-green-500' : passwordStrength.score > 1 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{passwordStrength.feedback?.[0] || 'Strong password'}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md ${validationErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Confirm your password"
                  required
                />
                {validationErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.confirmPassword}</p>
                )}
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isSubmitting || loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting || loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {mode === 'login' ? 'Signing in...' : 'Creating account...'}
              </span>
            ) : mode === 'login' ? (
              'Sign In'
            ) : (
              'Sign Up'
            )}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          <button
            onClick={toggleMode}
            className="text-blue-600 hover:text-blue-800 font-medium"
            disabled={isSubmitting}
          >
            {mode === 'login' 
              ? "Don't have an account? Sign up" 
              : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeliveryAuthModal;
