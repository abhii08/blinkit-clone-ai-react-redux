const HeroSection = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Paan Corner Banner */}
      <div className="relative bg-gradient-to-r from-green-400 to-green-600 rounded-2xl overflow-hidden mb-6">
        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
        <div className="relative px-8 py-12 flex items-center justify-between">
          <div className="text-white">
            <h2 className="text-4xl md:text-5xl font-bold mb-2">Paan corner</h2>
            <p className="text-xl md:text-2xl mb-6 opacity-90">Your favourite paan shop is now online</p>
            <button className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200">
              Shop Now
            </button>
          </div>
          <div className="hidden md:block">
            <div className="flex items-center space-x-4">
              <img 
                src="https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100&h=100&fit=crop&crop=center" 
                alt="Playing cards" 
                className="w-20 h-20 object-cover rounded-lg"
              />
              <img 
                src="https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=100&h=100&fit=crop&crop=center" 
                alt="Paan ingredients" 
                className="w-20 h-20 object-cover rounded-lg"
              />
              <img 
                src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100&h=100&fit=crop&crop=center" 
                alt="Drinks" 
                className="w-20 h-20 object-cover rounded-lg"
              />
              <img 
                src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100&h=100&fit=crop&crop=center" 
                alt="Snacks" 
                className="w-20 h-20 object-cover rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
