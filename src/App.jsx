import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '../redux/store';
import { useProducts, useUI } from '../redux/hooks';
import { fetchProductsByCategory } from '../redux/slices/productsSlice';
import { openAuthModal, openLocationSelector } from '../redux/slices/uiSlice';
import { toggleCart } from '../redux/slices/cartSlice';
import { useAuthSession } from './hooks/useAuthSession';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import PromoCards from './components/PromoCards';
import CategoryGrid from './components/CategoryGrid';
import ProductSection from './components/ProductSection';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import CartSidebar from './components/CartSidebar';
import LocationSelector from './components/LocationSelector';
import './App.css';


function AppContent() {
  const { productsByCategory, loading, dispatch } = useProducts();
  const { modals } = useUI();
  
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

  // Fetch products by category
  useEffect(() => {
    const categories = ['dairy-bread-eggs', 'sweet-tooth', 'snacks-munchies', 'cold-drinks-juices'];
    categories.forEach(categorySlug => {
      dispatch(fetchProductsByCategory({ categorySlug, limit: 6 }));
    });
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-white">
      <Navbar 
        onLoginClick={handleLogin}
        onCartClick={handleCartClick}
        onLocationClick={handleLocationClick}
      />
            <HeroSection />
            <PromoCards />
            <CategoryGrid />
            
      {/* Product Sections */}
      {loading.productsByCategory ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading products...</p>
          </div>
        </div>
      ) : (
        <>
          <ProductSection 
            title="Dairy, Bread & Eggs" 
            products={productsByCategory['dairy-bread-eggs'] || []}
          />
          
          <ProductSection 
            title="Sweet Tooth" 
            products={productsByCategory['sweet-tooth'] || []}
          />
          
          <ProductSection 
            title="Snacks & Munchies" 
            products={productsByCategory['snacks-munchies'] || []}
          />
          
          <ProductSection 
            title="Cold Drinks & Juices" 
            products={productsByCategory['cold-drinks-juices'] || []}
          />
        </>
      )}
      
      <Footer />

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
      <AppContent />
    </Provider>
  );
}

export default App;
