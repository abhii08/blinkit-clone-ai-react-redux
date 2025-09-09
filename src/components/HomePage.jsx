import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProductsByCategory } from '../../redux/slices/productsSlice';
import HeroSection from './HeroSection';
import PromoCards from './PromoCards';
import CategoryGrid from './CategoryGrid';
import ProductSection from './ProductSection';
import Footer from './Footer';

const HomePage = () => {
  const { productsByCategory, loading } = useSelector(state => state.products);
  const dispatch = useDispatch();

  // Fetch products by category
  useEffect(() => {
    const categories = ['dairy-bread-eggs', 'sweet-tooth', 'snacks-munchies', 'cold-drinks-juices'];
    categories.forEach(categorySlug => {
      dispatch(fetchProductsByCategory({ categorySlug, limit: 6 }));
    });
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-white">
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
    </div>
  );
};

export default HomePage;
