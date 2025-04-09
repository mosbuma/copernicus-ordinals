'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Network } from './networkUtils';

interface NetworkContextType {
  network: Network;
  setNetwork: (network: Network) => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

const STORAGE_KEY = 'copernicus_network';

export function NetworkProvider({ children }: { children: ReactNode }) {
  // Initialize with localStorage value or default to testnet
  const [network, setNetworkState] = useState<Network>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && (stored === 'MAIN' || stored === 'TEST' || stored === 'REGTEST')) {
        return stored as Network;
      }
    }
    return 'TEST';
  });

  // Update localStorage when network changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, network);
  }, [network]);

  const setNetwork = (newNetwork: Network) => {
    setNetworkState(newNetwork);
  };

  return (
    <NetworkContext.Provider value={{ network, setNetwork }}>{children}</NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}
