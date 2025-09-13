import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { canAccessUserFeatures, getRoleContext, ROLES } from '../utils/roleContext';
import { useRoleBasedAuth } from '../hooks/useRoleBasedAuth';
import HeroSection from './HeroSection';
import PromoCards from './PromoCards';
import CategoryGrid from './CategoryGrid';
import Footer from './Footer';

const HomePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, roleContext } = useRoleBasedAuth();

  useEffect(() => {
    // Check if this tab has the correct role context for user features
    const currentRole = getRoleContext();
    
    if (currentRole === ROLES.DELIVERY_AGENT) {
      // If this tab is set for delivery agent, redirect to delivery dashboard
      navigate('/delivery-dashboard');
      return;
    }
    
    // If no role context is set, this is likely a direct access to /home
    // Redirect to role selection to choose proper context
    if (!currentRole) {
      navigate('/');
      return;
    }
  }, [navigate]);

  // Only render if user has proper role context
  if (!canAccessUserFeatures()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <HeroSection />
      <PromoCards />
      <CategoryGrid />
      
      
      <Footer />
    </div>
  );
};

export default HomePage;
