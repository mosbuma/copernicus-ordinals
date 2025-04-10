import { networks } from 'bitcoinjs-lib';
import { NetworkType } from '@/types';

export const getBitcoinNetwork = (network: NetworkType): networks.Network => {
  switch (network) {
    case NetworkType.livenet:
      return networks.bitcoin;
    case NetworkType.testnet:
      return networks.testnet;
    default:
      throw new Error(`Invalid network: ${network}`);
  }
};
