const PromoCards = () => {
  const promoData = [
    {
      id: 1,
      title: "Pharmacy at your doorstep!",
      subtitle: "Cough syrups, pain relief sprays & more",
      buttonText: "Order Now",
      bgColor: "bg-gradient-to-br from-teal-400 to-teal-600",
      image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=150&h=150&fit=crop&crop=center"
    },
    {
      id: 2,
      title: "Pet Care supplies in minutes",
      subtitle: "Food, treats, toys & more",
      buttonText: "Order Now",
      bgColor: "bg-gradient-to-br from-yellow-400 to-orange-500",
      image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=150&h=150&fit=crop&crop=center"
    },
    {
      id: 3,
      title: "No time for a diaper run?",
      subtitle: "Get baby care essentials in minutes",
      buttonText: "Order Now",
      bgColor: "bg-gradient-to-br from-blue-400 to-blue-600",
      image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=150&h=150&fit=crop&crop=center"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {promoData.map((promo) => (
          <div
            key={promo.id}
            className={`${promo.bgColor} rounded-2xl p-6 text-white relative overflow-hidden group hover:scale-105 transition-transform duration-300 cursor-pointer`}
          >
            <div className="relative z-10">
              <h3 className="text-xl md:text-2xl font-bold mb-2">{promo.title}</h3>
              <p className="text-sm md:text-base mb-4 opacity-90">{promo.subtitle}</p>
              <button className="bg-white text-gray-800 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors duration-200">
                {promo.buttonText}
              </button>
            </div>
            <div className="absolute right-4 top-4 opacity-80">
              <img 
                src={promo.image} 
                alt={promo.title}
                className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PromoCards;
