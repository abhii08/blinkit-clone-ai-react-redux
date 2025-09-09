// Enhanced validation utilities for authentication and forms
export const validation = {
  // Email validation with comprehensive regex
  email: (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return null;
  },

  // Enhanced password validation
  password: (password) => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters long';
    if (!/(?=.*[a-z])/.test(password)) return 'Password must contain at least one lowercase letter';
    if (!/(?=.*[A-Z])/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/(?=.*\d)/.test(password)) return 'Password must contain at least one number';
    if (!/(?=.*[@$!%*?&])/.test(password)) return 'Password must contain at least one special character (@$!%*?&)';
    return null;
  },

  // Phone number validation (Indian format)
  phone: (phone) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phone) return 'Phone number is required';
    if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
      return 'Please enter a valid 10-digit Indian mobile number';
    }
    return null;
  },

  // Full name validation
  fullName: (name) => {
    if (!name) return 'Full name is required';
    if (name.trim().length < 2) return 'Name must be at least 2 characters long';
    if (!/^[a-zA-Z\s]+$/.test(name)) return 'Name can only contain letters and spaces';
    return null;
  },

  // Password confirmation
  confirmPassword: (password, confirmPassword) => {
    if (!confirmPassword) return 'Please confirm your password';
    if (password !== confirmPassword) return 'Passwords do not match';
    return null;
  },

  // Address validation
  address: {
    addressLine1: (address) => {
      if (!address) return 'Address is required';
      if (address.trim().length < 5) return 'Address must be at least 5 characters long';
      return null;
    },
    
    city: (city) => {
      if (!city) return 'City is required';
      if (city.trim().length < 2) return 'City name must be at least 2 characters long';
      return null;
    },
    
    postalCode: (code) => {
      const pinRegex = /^[1-9][0-9]{5}$/;
      if (!code) return 'PIN code is required';
      if (!pinRegex.test(code)) return 'Please enter a valid 6-digit PIN code';
      return null;
    }
  }
};

// Rate limiting utility for auth attempts
export class RateLimiter {
  constructor() {
    this.attempts = new Map();
  }

  isAllowed(identifier, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    const now = Date.now();
    const userAttempts = this.attempts.get(identifier) || [];
    
    // Remove old attempts outside the window
    const recentAttempts = userAttempts.filter(time => now - time < windowMs);
    
    if (recentAttempts.length >= maxAttempts) {
      return {
        allowed: false,
        resetTime: Math.ceil((recentAttempts[0] + windowMs - now) / 1000 / 60)
      };
    }
    
    // Add current attempt
    recentAttempts.push(now);
    this.attempts.set(identifier, recentAttempts);
    
    return { allowed: true };
  }

  reset(identifier) {
    this.attempts.delete(identifier);
  }
}

// Create global rate limiter instance
export const authRateLimiter = new RateLimiter();

// Password strength calculator
export const getPasswordStrength = (password) => {
  let score = 0;
  let feedback = [];

  if (password.length >= 8) score += 1;
  else feedback.push('Use at least 8 characters');

  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Add lowercase letters');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Add uppercase letters');

  if (/\d/.test(password)) score += 1;
  else feedback.push('Add numbers');

  if (/[@$!%*?&]/.test(password)) score += 1;
  else feedback.push('Add special characters');

  const strength = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'][score];
  const color = ['#ff4444', '#ff8800', '#ffaa00', '#88cc00', '#00cc44'][score];

  return { score, strength, color, feedback };
};
