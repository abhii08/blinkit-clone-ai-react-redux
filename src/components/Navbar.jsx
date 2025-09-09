import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useCart, useLocation } from '../../redux/hooks';
import ProfileDropdown from './ProfileDropdown';
import { BsCart4 } from 'react-icons/bs';

const Navbar = ({ onLoginClick, onCartClick, onLocationClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileButtonRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { totalItems } = useCart();
  const { selectedAddress, currentLocation } = useLocation();

  const handleLogoClick = () => {
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div 
                className="relative cursor-pointer hover:opacity-80 transition-opacity duration-200"
                onClick={handleLogoClick}
              >
                <h1 className="text-3xl font-bold">
                  <span className="text-yellow-400">क्षिप्र</span>
                  <span className="text-green-500">म्</span>
                </h1>
                <p className="text-xs font-medium text-gray-500 tracking-widest uppercase absolute -bottom-4 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                  swift • immediate
                </p>
              </div>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="hidden md:flex items-center space-x-2">
            <button
              onClick={onLocationClick}
              className="text-left hover:bg-gray-50 p-2 rounded-lg transition-colors"
            >
              <p className="text-lg font-semibold text-gray-900">Delivery in 8 minutes</p>
              <div className="flex items-center text-sm text-gray-600">
                <span>
                  {selectedAddress
                    ? `${selectedAddress.city || selectedAddress.formatted_address?.split(',')[1]?.trim() || 'Selected Location'}`
                    : currentLocation
                      ? 'Current Location'
                      : 'Gota, Ahmedabad, Gujarat, India'
                  }
                </span>
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg mx-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder='Search "sugar"'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Login & Cart */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="relative">
                <button
                  ref={profileButtonRef}
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center space-x-3 hover:bg-gray-50 p-2 rounded-lg transition-colors duration-200"
                >
                  <div className="hidden md:block text-right">
                    <div className="flex items-center space-x-1">
                      <span className="text-sm font-medium text-gray-900">Account</span>
                      <svg
                        className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${showProfileDropdown ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    <p className="text-xs text-gray-500 text-left">
                      {user.user_metadata?.full_name || user.email?.split('@')[0]}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-medium">
                    {(user.user_metadata?.full_name || user.email)[0].toUpperCase()}
                  </div>
                </button>

                <ProfileDropdown
                  isOpen={showProfileDropdown}
                  onClose={() => setShowProfileDropdown(false)}
                  user={user}
                  triggerRef={profileButtonRef}
                />
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className="text-gray-700 hover:text-gray-900 font-medium transition-colors duration-200"
              >
                Login
              </button>
            )}

            <button
              onClick={onCartClick}
              className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg transition-colors duration-200 relative group"
            >
              <BsCart4 className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg animate-pulse">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="md:hidden px-4 pb-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm"
            placeholder='Search "sugar"'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
