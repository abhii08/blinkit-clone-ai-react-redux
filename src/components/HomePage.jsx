import HeroSection from './HeroSection';
import PromoCards from './PromoCards';
import CategoryGrid from './CategoryGrid';
import Footer from './Footer';

const HomePage = () => {

  // Products are now fetched by CategoryGrid component

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
