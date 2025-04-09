import React from 'react';

export const ApiKeyDisplay = ({
  apiKey,
  isMainnet,
}: {
  apiKey: string | undefined;
  isMainnet: boolean;
}) => {
  return (
    <div>
      <div className={'text-4xl text-center font-bold text-white border-2 border-white'}>
        API key [{isMainnet ? 'mainnet' : 'testnet'}]: {apiKey || '-----'}
      </div>
    </div>
  );
};
