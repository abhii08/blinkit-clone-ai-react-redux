import { Provider } from 'react-redux';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { store } from '../redux/store';
import { useAuthSession } from './hooks/useAuthSession';
import Layout from './components/Layout';
import RoleSelection from './components/RoleSelection';
import HomePage from './components/HomePage';
import CategoryPage from './components/CategoryPage';
import OrderPlacement from './components/OrderPlacement';
import OrderConfirmation from './components/OrderConfirmation';
import OrderTracking from './components/OrderTracking';
import OrdersList from './components/OrdersList';
import DeliveryAgentDashboard from './components/DeliveryAgentDashboard';
import './App.css';


function AppContent() {
  // Initialize auth session management
  useAuthSession();

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<RoleSelection />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/category/:categorySlug" element={<CategoryPage />} />
        <Route path="/order-placement" element={<OrderPlacement />} />
        <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
        <Route path="/track-order/:orderId" element={<OrderTracking />} />
        <Route path="/orders" element={<OrdersList />} />
        <Route path="/delivery-dashboard" element={<DeliveryAgentDashboard />} />
      </Routes>
    </Layout>
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
