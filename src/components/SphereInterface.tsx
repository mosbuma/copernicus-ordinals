import React, { useState } from 'react';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import { abbreviateHash } from './OrderDetail';

export interface SphereInterfaceProps {
  address: string | undefined;
  recipientAddress: string | undefined;
  onCreateAddress: () => Promise<void>;
  onResetAddress: () => void;
  showResetAddress: boolean;
  onInscribe: () => void;
  isMainnet: boolean;
}

const downloadAddressFile = (address: string) => {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:]/g, '').replace('T', '-').split('.')[0];

  const content = `COPERNICUS II\nCreated: ${now.toISOString()}\nAddress: ${address}\n`;

  const blob = new Blob([content], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `copernicus-address-${timestamp}.txt`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

export default function SphereInterface({
  address,
  recipientAddress,
  onCreateAddress,
  onResetAddress,
  onInscribe,
  isMainnet,
  showResetAddress,
}: SphereInterfaceProps) {
  const [isNewlyCreated, setIsNewlyCreated] = useState(false);
  const [showCopied, setShowCopied] = useState(false);

  const handleCreateAddress = async () => {
    await onCreateAddress();
    setIsNewlyCreated(true);
  };

  const handleAddressClick = async (addr: string) => {
    try {
      await navigator.clipboard.writeText(addr);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
      downloadAddressFile(addr);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  // Watch for address changes and download file when it's newly created
  React.useEffect(() => {
    if (address && isNewlyCreated) {
      downloadAddressFile(address);
      setIsNewlyCreated(false);
    }
  }, [address, isNewlyCreated]);

  return (
    <div className="flex flex-col items-center w-full h-full max-w-3/4 mx-auto px-4 sm:px-6 lg:px-8 bg-black">
      <h1 className="text-center text-[3vw] font-bold text-white mt-2 mb-4">
        Copernicus II {isMainnet ? '' : ' (TESTNET)'}
      </h1>
      <div className="relative w-full max-w-[15vw] aspect-square mb-4">
        <Image
          src="/copernicus-sphere-2.jpg"
          alt="Copernicus Sphere"
          fill
          className="object-contain"
          sizes="15vw"
          priority
        />
      </div>
      {address && (
        <div className="relative">
          <div
            onClick={() => handleAddressClick(address)}
            className="text-center mb-4 text-[1.5vw] md:text-[1.25vw] font-bold text-white break-all px-4 cursor-pointer hover:text-blue-400 transition-colors"
          >
            {address}
          </div>
          {showCopied && (
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-sm">
              Copied to clipboard!
            </div>
          )}
        </div>
      )}

      {!address && (
        <Button
          className="button mb-2 text-[1.5vw] bg-gray-800 hover:bg-gray-700 text-white border border-gray-500"
          onClick={handleCreateAddress}
        >
          Create Address
        </Button>
      )}
      {address && showResetAddress && (
        <Button
          className="button mb-2 text-[1.5vw] bg-gray-800 hover:bg-gray-700 text-white border border-gray-500"
          onClick={onResetAddress}
        >
          Reset Address
        </Button>
      )}
      {address && (
        <Button
          className="button mb-2 text-[1.5vw] bg-gray-800 hover:bg-gray-700 text-white border border-gray-500"
          onClick={onInscribe}
        >
          Start Inscribe to {abbreviateHash(recipientAddress || '')}
        </Button>
      )}
    </div>
  );
}
