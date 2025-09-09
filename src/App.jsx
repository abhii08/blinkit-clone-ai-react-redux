import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { store } from '../redux/store';
import { useUI } from '../redux/hooks';
import { openAuthModal, openLocationSelector } from '../redux/slices/uiSlice';
import { toggleCart } from '../redux/slices/cartSlice';
import { useAuthSession } from './hooks/useAuthSession';
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import CategoryPage from './components/CategoryPage';
import AuthModal from './components/AuthModal';
import CartSidebar from './components/CartSidebar';
import LocationSelector from './components/LocationSelector';
import './App.css';


function AppContent() {
  const { modals, dispatch } = useUI();
  
  // Initialize auth session management
  useAuthSession();

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
      <Navbar 
        onLoginClick={handleLogin}
        onCartClick={handleCartClick}
        onLocationClick={handleLocationClick}
      />
      
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/category/:categorySlug" element={<CategoryPage />} />
      </Routes>

      {/* Modals */}
      <AuthModal
        isOpen={modals.auth.isOpen}
        initialMode={modals.auth.mode}
      />
      
      <CartSidebar />
      
      <LocationSelector
        isOpen={modals.locationSelector.isOpen}
      />
    </div>
  );
}

function App() {
  return (
    <Provider store={store}>
      <Router>
        <AppContent />
      </Router>
    </Provider>
  );
}

export default App;
