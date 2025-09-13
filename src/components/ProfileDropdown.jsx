import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogout } from '../hooks/useLogout';
import { getUserDisplayName } from '../utils/authHelpers';

const ProfileDropdown = ({ isOpen, onClose, user, triggerRef }) => {
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { logout } = useLogout();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        triggerRef?.current &&
        !triggerRef.current.contains(event.target)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, triggerRef]);

  const handleLogout = async () => {
    try {
      onClose();
      const result = await logout();
      
      if (!result.success) {
        console.error('Logout failed:', result.error);
        // Still navigate even if logout had issues
        navigate('/', { replace: true });
      }
    } catch (error) {
      console.error('Error during logout:', error);
      navigate('/', { replace: true });
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 transform transition-all duration-200 ease-out"
      style={{ 
        opacity: isOpen ? 1 : 0,
        transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.95)'
      }}
    >
      {/* Account Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">My Account</h3>
        <p className="text-sm text-gray-600">
          {user?.user_metadata?.phone || user?.phone || getUserDisplayName(user)}
        </p>
      </div>

      {/* Menu Items */}
      <div className="py-2">
        <MenuItem 
          icon={<UserIcon />}
          text="My Orders"
          onClick={() => {
            navigate('/orders');
            onClose();
          }}
        />
        
        <MenuItem 
          icon={<LocationIcon />}
          text="Saved Addresses"
          onClick={() => {
            console.log('Navigate to Saved Addresses');
            onClose();
          }}
        />
        
        <MenuItem 
          icon={<GiftIcon />}
          text="E-Gift Cards"
          onClick={() => {
            console.log('Navigate to E-Gift Cards');
            onClose();
          }}
        />
        
        <MenuItem 
          icon={<QuestionIcon />}
          text="FAQ's"
          onClick={() => {
            console.log('Navigate to FAQs');
            onClose();
          }}
        />
        
        <MenuItem 
          icon={<PrivacyIcon />}
          text="Account Privacy"
          onClick={() => {
            console.log('Navigate to Account Privacy');
            onClose();
          }}
        />
        
        <MenuItem 
          icon={<LogoutIcon />}
          text="Log Out"
          onClick={handleLogout}
        />
      </div>

      {/* QR Code Section */}
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
        <div className="flex items-start space-x-3">
          <div className="w-16 h-16 bg-gray-200 rounded border flex items-center justify-center">
            {/* QR Code placeholder */}
            <div className="w-12 h-12 bg-black opacity-20 rounded grid grid-cols-4 gap-px">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="bg-white rounded-sm"></div>
              ))}
            </div>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-gray-900 mb-1">
              Simple way to get groceries
            </h4>
            <p className="text-xs text-blue-600 font-medium">in minutes</p>
            <p className="text-xs text-gray-600 mt-1">
              Scan the QR code and download blinkit app
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Menu Item Component
const MenuItem = ({ icon, text, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150"
  >
    <span className="w-5 h-5 text-gray-600 mr-3">{icon}</span>
    <span className="text-sm text-gray-700">{text}</span>
  </button>
);

// Icon Components
const UserIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
);

const LocationIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const GiftIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
  </svg>
);

const QuestionIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PrivacyIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const LogoutIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

export default ProfileDropdown;
