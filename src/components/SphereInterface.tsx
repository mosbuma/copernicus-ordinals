import React from 'react';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import { abbreviateHash } from './OrderDetail';

export interface SphereInterfaceProps {
  address: string | undefined;
  recipientAddress: string | undefined;
  onCreateAddress: () => void;
  onResetAddress: () => void;
  showResetAddress: boolean;
  onInscribe: () => void;
  isMainnet: boolean;
}
export default function SphereInterface({
  address,
  recipientAddress,
  onCreateAddress,
  onResetAddress,
  onInscribe,
  isMainnet,
  showResetAddress,
}: SphereInterfaceProps) {
  return (
    <div className="flex flex-col items-center w-full h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-gray-900">
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
        <div className="text-center mb-4 text-[1.5vw] font-bold text-white break-all px-4">
          {address}
        </div>
      )}

      {!address && (
        <Button
          className="button mb-2 text-[1.5vw] bg-gray-800 hover:bg-gray-700 text-white border border-gray-500"
          onClick={onCreateAddress}
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
