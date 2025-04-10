'use client';

import { useState, useEffect } from 'react';

export const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);

    // Add event listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`px-4 py-2 rounded-full flex items-center gap-2 ${
          isOnline ? 'bg-green-600' : 'bg-red-600'
        } text-white shadow-lg`}
      >
        <div
          className={`w-3 h-3 rounded-full ${
            isOnline ? 'bg-green-300 animate-pulse' : 'bg-red-300'
          }`}
        />
        <span className="text-sm font-medium">
          {isOnline ? 'Internet Connected' : 'Internet Disconnected'}
        </span>
      </div>
    </div>
  );
};
