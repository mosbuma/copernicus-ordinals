'use client';

import { useState } from 'react';
import { BiPowerOff } from 'react-icons/bi';

export const ShutdownButton = () => {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleShutdown = async () => {
    try {
      const response = await fetch('/api/shutdown', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Shutdown request failed');
      }
    } catch (error) {
      console.error('Failed to initiate shutdown:', error);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="fixed top-4 right-4 z-50 p-3 rounded-full bg-gray-800 hover:bg-gray-700 text-red-500 shadow-lg transition-all duration-200 hover:scale-110"
        title="Shutdown System"
      >
        <BiPowerOff className="h-6 w-6" />
      </button>

      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <BiPowerOff className="h-6 w-6 text-red-500" />
              <h3 className="text-xl font-bold text-white">Confirm Shutdown</h3>
            </div>
            <p className="text-gray-300 mb-6">
              Are you sure you want to shutdown the system? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleShutdown();
                  setShowConfirm(false);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200 flex items-center gap-2"
              >
                <BiPowerOff className="h-5 w-5" />
                Shutdown
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
