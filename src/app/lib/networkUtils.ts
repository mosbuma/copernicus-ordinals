import { networks } from 'bitcoinjs-lib';
import { NetworkType } from '@/types';
// export interface NetworkConfig {
//   network: NetworkType;
//   requiresAuth: boolean;
//   rpcUrl: string;
//   rpcUser: string;
//   rpcPass: string;
// }

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

// export const NETWORK_CONFIG: Record<NetworkType, NetworkConfig> = {
//   livenet: {
//     network: NetworkType.livenet,
//     rpcUrl: 'https://btc.nownodes.io',
//     requiresAuth: true,
//     rpcUser: process.env.MAINNET_RPC_USER || '',
//     rpcPass: process.env.MAINNET_API_KEY || '',
//   },
//   testnet: {
//     network: NetworkType.testnet,
//     rpcUrl: 'https://go.getblock.io/034ae791735342c29ee0eaac9ff92471',
//     requiresAuth: false,
//     rpcUser: process.env.TESTNET_RPC_USER || '',
//     rpcPass: process.env.TESTNET_API_KEY || '',
//   },
// };

// export const getRpcConfig = (network: NetworkType): NetworkConfig => {
//   switch (network) {
//     case NetworkType.livenet:
//       return NETWORK_CONFIG.livenet;
//     case NetworkType.testnet:
//       return NETWORK_CONFIG.testnet;
//     default:
//       throw new Error(`Invalid network: ${network}`);
//   }
// };
