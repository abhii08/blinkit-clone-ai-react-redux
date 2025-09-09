import { useState } from 'react';

const MapErrorFallback = ({ error, onRetry, onManualEntry }) => {
  const [showDetails, setShowDetails] = useState(false);

  const getErrorSolution = (errorMessage) => {
    if (errorMessage.includes('authentication failed') || errorMessage.includes("can't load Google Maps")) {
      return {
        title: "Google Maps API Issue",
        solutions: [
          "Check if your Google Maps API key is valid",
          "Ensure billing is enabled in Google Cloud Console",
          "Verify the API key has proper permissions",
          "Check if Maps JavaScript API is enabled"
        ],
        action: "Configure API Key"
      };
    }
    
    if (errorMessage.includes('Location access was denied')) {
      return {
        title: "Location Permission Denied",
        solutions: [
          "Click the location icon in your browser's address bar",
          "Select 'Always allow' for location access",
          "Refresh the page after granting permission",
          "Check browser settings for location permissions"
        ],
        action: "Enable Location Access"
      };
    }

    return {
      title: "Location Service Error",
      solutions: [
        "Check your internet connection",
        "Try refreshing the page",
        "Clear browser cache and cookies",
        "Try using a different browser"
      ],
      action: "Try Again"
    };
  };

  const errorInfo = getErrorSolution(error);

  return (
    <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-6">
      <div className="text-center max-w-md">
        {/* Error Icon */}
        <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>

        {/* Error Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {errorInfo.title}
        </h3>

        {/* Error Message */}
        <p className="text-sm text-gray-600 mb-4">
          We're having trouble loading the map. You can still add your location manually.
        </p>

        {/* Solutions Toggle */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-blue-600 hover:text-blue-800 mb-4 flex items-center mx-auto"
        >
          <span>{showDetails ? 'Hide' : 'Show'} troubleshooting steps</span>
          <svg 
            className={`w-4 h-4 ml-1 transform transition-transform ${showDetails ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Detailed Solutions */}
        {showDetails && (
          <div className="bg-blue-50 rounded-lg p-4 mb-4 text-left">
            <h4 className="font-medium text-blue-900 mb-2">How to fix this:</h4>
            <ol className="text-sm text-blue-800 space-y-1">
              {errorInfo.solutions.map((solution, index) => (
                <li key={index} className="flex items-start">
                  <span className="font-medium mr-2">{index + 1}.</span>
                  <span>{solution}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Try Again
          </button>
          
          <button
            onClick={onManualEntry}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Enter Address Manually
          </button>
        </div>

        {/* Technical Error Details */}
        <details className="mt-4 text-left">
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
            Technical Details
          </summary>
          <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-600 font-mono break-all">
            {error}
          </div>
        </details>
      </div>
    </div>
  );
};

export default MapErrorFallback;
