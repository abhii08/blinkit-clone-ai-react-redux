import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaTruck, FaShoppingCart } from 'react-icons/fa';
import dhipramLogo from '../assets/dhipram-logo.svg';

const RoleSelection = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    
    // Navigate based on role selection
    if (role === 'user') {
      navigate('/home');
    } else if (role === 'delivery-agent') {
      navigate('/delivery-dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex flex-col items-center justify-center p-4">
      {/* App Logo */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-4">
          <FaShoppingCart className="text-6xl text-green-600 mr-4" />
          <div className="relative">
            <h1 className="text-5xl font-bold">
              <span className="text-yellow-400">क्षिप्र</span>
              <span className="text-green-500">म्</span>
            </h1>
            <p className="text-sm font-medium text-gray-500 tracking-widest uppercase absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
              swift • immediate
            </p>
          </div>
        </div>
        <p className="text-xl text-gray-600 font-medium mt-8">Choose your role to continue</p>
      </div>

      {/* Role Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* User Role Card */}
        <div 
          onClick={() => handleRoleSelect('user')}
          className={`
            bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer
            border-2 p-8 text-center transform hover:scale-105
            ${selectedRole === 'user' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'}
          `}
        >
          <div className="flex flex-col items-center space-y-6">
            <div className="bg-green-100 p-6 rounded-full">
              <FaUser className="text-5xl text-green-600" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Continue as User</h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                Browse products, add items to cart, and place orders for quick delivery
              </p>
            </div>

            <div className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors">
              Shop Now
            </div>
          </div>
        </div>

        {/* Delivery Agent Role Card */}
        <div 
          onClick={() => handleRoleSelect('delivery-agent')}
          className={`
            bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer
            border-2 p-8 text-center transform hover:scale-105
            ${selectedRole === 'delivery-agent' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}
          `}
        >
          <div className="flex flex-col items-center space-y-6">
            <div className="bg-blue-100 p-6 rounded-full">
              <FaTruck className="text-5xl text-blue-600" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Continue as Delivery Agent</h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                Manage deliveries, track orders, and update delivery status in real-time
              </p>
            </div>

            <div className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors">
              Start Delivering
            </div>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-12 text-center max-w-2xl">
        <p className="text-gray-500 text-sm">
          New to Blinkit? You can create an account after selecting your role. 
          Already have an account? Simply choose your role to continue.
        </p>
      </div>
    </div>
  );
};

export default RoleSelection;
