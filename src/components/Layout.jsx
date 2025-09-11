import { useLocation } from 'react-router-dom';
import { useUI } from '../../redux/hooks';
import { openAuthModal, openLocationSelector } from '../../redux/slices/uiSlice';
import { toggleCart } from '../../redux/slices/cartSlice';
import Navbar from './Navbar';
import AuthModal from './AuthModal';
import CartSidebar from './CartSidebar';
import LocationSelector from './LocationSelector';

const Layout = ({ children }) => {
  const location = useLocation();
  const { modals, dispatch } = useUI();

  // Pages that should not show the navbar
  const noNavbarPages = ['/', '/delivery-dashboard'];
  const showNavbar = !noNavbarPages.includes(location.pathname);

  const handleLogin = () => {
    dispatch(openAuthModal('login'));
  };

  const handleCartClick = () => {
    dispatch(toggleCart());
  };

  const handleLocationClick = () => {
    dispatch(openLocationSelector());
  };

  return (
    <div className="min-h-screen bg-white">
      {showNavbar && (
        <Navbar 
          onLoginClick={handleLogin}
          onCartClick={handleCartClick}
          onLocationClick={handleLocationClick}
        />
      )}
      
      {children}

      {/* Modals - Show for all pages */}
      <AuthModal
        isOpen={modals.auth.isOpen}
        initialMode={modals.auth.mode}
      />
      
      {showNavbar && <CartSidebar />}
      
      {showNavbar && (
        <LocationSelector
          isOpen={modals.locationSelector.isOpen}
        />
      )}
    </div>
  );
};

export default Layout;
