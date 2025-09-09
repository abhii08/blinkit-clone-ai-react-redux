import QuantitySelector from './QuantitySelector';

const ProductSection = ({ title, products, showSeeAll = true }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        {showSeeAll && (
          <button className="text-green-600 font-semibold hover:text-green-700 transition-colors duration-200">
            see all
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow duration-200 cursor-pointer group"
          >
            <div className="relative mb-3">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-32 object-cover rounded-lg group-hover:scale-105 transition-transform duration-200"
              />
              <div className="absolute top-2 left-2 bg-gray-100 text-xs px-2 py-1 rounded text-gray-600">
                {product.time}
              </div>
            </div>
            
            <h3 className="font-semibold text-sm mb-1 text-gray-900 line-clamp-2">
              {product.name}
            </h3>
            
            <p className="text-xs text-gray-500 mb-2">{product.quantity}</p>
            
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900">₹{product.price}</span>
              <QuantitySelector product={product} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductSection;
