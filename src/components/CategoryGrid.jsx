const CategoryGrid = () => {
  const categories = [
    {
      id: 1,
      name: "Paan",
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100&h=100&fit=crop&crop=center"
    },
    {
      id: 2,
      name: "Dairy, Bread & Eggs",
      image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=100&h=100&fit=crop&crop=center"
    },
    {
      id: 3,
      name: "Fruits & Vegetables",
      image: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=100&h=100&fit=crop&crop=center"
    },
    {
      id: 4,
      name: "Cold Drinks & Juices",
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100&h=100&fit=crop&crop=center"
    },
    {
      id: 5,
      name: "Snacks & Munchies",
      image: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=100&h=100&fit=crop&crop=center"
    },
    {
      id: 6,
      name: "Breakfast & Instant Food",
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100&h=100&fit=crop&crop=center"
    },
    {
      id: 7,
      name: "Sweet Tooth",
      image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=100&h=100&fit=crop&crop=center"
    },
    {
      id: 8,
      name: "Bakery & Biscuits",
      image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=100&h=100&fit=crop&crop=center"
    },
    {
      id: 9,
      name: "Tea, Coffee & Health Drinks",
      image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=100&h=100&fit=crop&crop=center"
    },
    {
      id: 10,
      name: "Atta, Rice & Dal",
      image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=100&h=100&fit=crop&crop=center"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-5 md:grid-cols-10 gap-4">
        {categories.map((category) => (
          <div
            key={category.id}
            className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer group"
          >
            <div className="w-16 h-16 md:w-20 md:h-20 mb-3 rounded-lg overflow-hidden group-hover:scale-105 transition-transform duration-200">
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-xs md:text-sm font-medium text-gray-800 text-center leading-tight">
              {category.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryGrid;
