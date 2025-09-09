const SimpleQuantitySelector = ({ quantity, onIncrement, onDecrement, size = "md" }) => {
  const sizeClasses = {
    sm: "text-xs px-1 py-1",
    md: "text-sm px-2 py-1.5",
    lg: "text-base px-3 py-2"
  };

  const buttonSizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm", 
    lg: "w-10 h-10 text-base"
  };

  const containerWidthClasses = {
    sm: "w-[60px]",
    md: "w-[80px]",
    lg: "w-[100px]"
  };

  return (
    <div className={`flex items-center justify-center bg-green-600 rounded-lg ${containerWidthClasses[size]} ${sizeClasses[size]}`}>
      {/* Decrement Button */}
      <button
        onClick={onDecrement}
        className={`bg-green-600 hover:bg-green-700 text-white font-bold transition-colors duration-200 flex items-center justify-center rounded-l-lg ${buttonSizeClasses[size]}`}
      >
        −
      </button>
      
      {/* Quantity Display */}
      <div className={`bg-green-600 text-white font-semibold flex-1 text-center flex items-center justify-center ${sizeClasses[size]}`}>
        {quantity}
      </div>
      
      {/* Increment Button */}
      <button
        onClick={onIncrement}
        className={`bg-green-600 hover:bg-green-700 text-white font-bold transition-colors duration-200 flex items-center justify-center rounded-r-lg ${buttonSizeClasses[size]}`}
      >
        +
      </button>
    </div>
  );
};

export default SimpleQuantitySelector;
