import { useState, useEffect } from 'react';
import { useAuth, useUI, useCart } from '../../redux/hooks';
import { signInUser, signUpUser, clearError } from '../../redux/slices/authSlice';
import { closeAuthModal, setAuthMode, clearPendingAction } from '../../redux/slices/uiSlice';
import { addLocalItem, updateLocalItem, removeLocalItem } from '../../redux/slices/cartSlice';
import { validation, authRateLimiter, getPasswordStrength } from '../utils/validation';

const AuthModal = ({ isOpen, initialMode = 'login' }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    confirmPassword: ''
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [isRateLimited, setIsRateLimited] = useState(false);

  const { loading, error, dispatch } = useAuth();
  const { modals, pendingAction } = useUI();
  const { dispatch: cartDispatch } = useCart();
  
  const mode = modals.auth.mode;

  const validateForm = () => {
    const errors = {};
    
    // Email validation
    const emailError = validation.email(formData.email);
    if (emailError) errors.email = emailError;
    
    // Password validation
    const passwordError = validation.password(formData.password);
    if (passwordError) errors.password = passwordError;
    
    if (mode === 'signup') {
      // Full name validation
      const nameError = validation.fullName(formData.fullName);
      if (nameError) errors.fullName = nameError;
      
      // Phone validation
      const phoneError = validation.phone(formData.phone);
      if (phoneError) errors.phone = phoneError;
      
      // Confirm password validation
      const confirmError = validation.confirmPassword(formData.password, formData.confirmPassword);
      if (confirmError) errors.confirmPassword = confirmError;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());

    // Check rate limiting
    const rateLimitCheck = authRateLimiter.isAllowed(formData.email);
    if (!rateLimitCheck.allowed) {
      setIsRateLimited(true);
      return;
    }

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      if (mode === 'login') {
        await dispatch(signInUser({ email: formData.email, password: formData.password })).unwrap();
        authRateLimiter.reset(formData.email); // Reset on successful login
      } else {
        await dispatch(signUpUser({ 
          email: formData.email, 
          password: formData.password, 
          userData: { 
            full_name: formData.fullName, 
            phone: formData.phone 
          }
        })).unwrap();
      }
      
      // Execute pending action if exists
      if (pendingAction) {
        executePendingAction(pendingAction);
        dispatch(clearPendingAction());
      }
      
      dispatch(closeAuthModal());
    } catch (error) {
      // Error is handled by Redux
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: null
      });
    }
    
    // Update password strength for password field
    if (name === 'password' && mode === 'signup') {
      setPasswordStrength(getPasswordStrength(value));
    }
    
    // Reset rate limit status
    if (isRateLimited) {
      setIsRateLimited(false);
    }
  };

  const executePendingAction = (action) => {
    switch (action.type) {
      case 'ADD_TO_CART':
        if (action.quantity === 1) {
          cartDispatch(addLocalItem({
            product: action.product,
            quantity: 1
          }));
        } else {
          cartDispatch(updateLocalItem({
            productId: action.product.id,
            quantity: action.quantity
          }));
        }
        break;
      case 'UPDATE_CART':
        if (action.quantity <= 0) {
          cartDispatch(removeLocalItem({
            productId: action.product.id
          }));
        } else {
          cartDispatch(updateLocalItem({
            productId: action.product.id,
            quantity: action.quantity
          }));
        }
        break;
      default:
        break;
    }
  };

  const switchMode = () => {
    dispatch(setAuthMode(mode === 'login' ? 'signup' : 'login'));
    dispatch(clearError());
    setFormData({
      email: '',
      password: '',
      fullName: '',
      phone: '',
      confirmPassword: ''
    });
    setValidationErrors({});
    setPasswordStrength(null);
    setIsRateLimited(false);
  };

  const handleClose = () => {
    // Clear pending action when modal is closed without login
    if (pendingAction) {
      dispatch(clearPendingAction());
    }
    dispatch(closeAuthModal());
  };

  useEffect(() => {
    if (initialMode && initialMode !== mode) {
      dispatch(setAuthMode(initialMode));
    }
  }, [initialMode, mode, dispatch]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'login' ? 'Login' : 'Sign Up'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        {isRateLimited && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            Too many login attempts. Please try again in a few minutes.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    validationErrors.fullName 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-green-500'
                  }`}
                  placeholder="Enter your full name"
                />
                {validationErrors.fullName && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.fullName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    validationErrors.phone 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-green-500'
                  }`}
                  placeholder="Enter your phone number (10 digits)"
                />
                {validationErrors.phone && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
                )}
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                validationErrors.email 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-green-500'
              }`}
              placeholder="Enter your email"
            />
            {validationErrors.email && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                validationErrors.password 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-green-500'
              }`}
              placeholder="Enter your password"
              minLength={8}
            />
            {validationErrors.password && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
            )}
            {mode === 'signup' && passwordStrength && formData.password && (
              <div className="mt-2">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(passwordStrength.score / 5) * 100}%`,
                        backgroundColor: passwordStrength.color
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium" style={{ color: passwordStrength.color }}>
                    {passwordStrength.strength}
                  </span>
                </div>
                {passwordStrength.feedback.length > 0 && (
                  <p className="mt-1 text-xs text-gray-600">
                    {passwordStrength.feedback.join(', ')}
                  </p>
                )}
              </div>
            )}
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  validationErrors.confirmPassword 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-green-500'
                }`}
                placeholder="Confirm your password"
                minLength={8}
              />
              {validationErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.confirmPassword}</p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Please wait...' : (mode === 'login' ? 'Login' : 'Create Account')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={switchMode}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              {mode === 'login' ? 'Sign up' : 'Login'}
            </button>
          </p>
        </div>

        {mode === 'signup' && (
          <div className="mt-4 text-xs text-gray-500 text-center">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
