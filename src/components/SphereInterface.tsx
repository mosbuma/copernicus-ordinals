import React from 'react';
import Image from 'next/image';
import Button from '@/components/ui/Button';

export interface SphereInterfaceProps {
  address: string | undefined;
  onCreateAddress: () => void;
  onResetAddress: () => void;
  isMainnet: boolean;
}
export default function SphereInterface({
  address,
  onCreateAddress,
  onResetAddress,
  isMainnet,
}: SphereInterfaceProps) {
  const isDevelopment = process.env.NODE_ENV !== 'production'; // only in development mode
  return (
    <div className="flex flex-col items-center w-full h-full">
      <div className="text-center text-8xl mt-8 mb-16 bold text-white">
        Copernicus II {isMainnet ? '' : ' (TESTNET)'}
      </div>
      <Image
        src="/copernicus-sphere-2.jpg"
        alt="Copernicus Sphere"
        width={500}
        height={500}
        className="mb-16"
      />
      {address && <div className="text-center text-4xl bold text-white mb-16">{address}</div>}

      {!address && (
        <Button className="button mb-8" onClick={onCreateAddress}>
          Create Address
        </Button>
      )}
      {address && isDevelopment && (
        <Button className="button mb-8" onClick={onResetAddress}>
          Reset Address
        </Button>
      )}
    </div>
  );
}
