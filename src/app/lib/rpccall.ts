// import { Network, getRpcConfig } from '@/app/lib/networkUtils';

// export interface Transaction {
//   txid: string;
//   vout: {
//     value: number;
//     scriptPubKey: {
//       address?: string;
//     };
//   }[];
// }

// // export interface UTXO {
// //   txid: string;
// //   vout: number;
// //   address: string;
// //   amount: number;
// // }

// type RpcParams = (string | number | boolean | object | null)[];

// export const makeRpcCall = async <T = unknown>(
//   network: Network,
//   method: string,
//   params: RpcParams
// ): Promise<T> => {
//   const { rpcUrl, rpcUser, rpcPass } = getRpcConfig(network);

//   const response = await fetch(rpcUrl, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       Authorization: 'Basic ' + btoa(`${rpcUser}:${rpcPass}`),
//     },
//     body: JSON.stringify({
//       jsonrpc: '1.0',
//       id: 'curltext',
//       method,
//       params,
//     }),
//   });

//   // console.log(`>>>> makeRpcCall ${network}.${method} - GOT RESPONSE `, response);

//   const data = await response.json();
//   if (!response.ok) {
//     throw new Error(
//       `RPC call failed: ${method} - ${response.status} - ${data.error?.message || 'Unknown error'}`
//     );
//   }

//   return data.result as T;
// };

// export const makeRpcCallWithWalletName = async <T = unknown>(
//   network: Network,
//   method: string,
//   params: RpcParams,
//   walletName: string
// ): Promise<T> => {
//   const { rpcUrl, rpcUser, rpcPass } = getRpcConfig(network);

//   const response = await fetch(`${rpcUrl}/wallet/${walletName}`, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       Authorization: 'Basic ' + btoa(`${rpcUser}:${rpcPass}`),
//     },
//     body: JSON.stringify({
//       jsonrpc: '1.0',
//       id: 'curltext',
//       method,
//       params,
//     }),
//   });

//   const data = await response.json();
//   if (!response.ok) {
//     throw new Error(
//       `RPC call failed: ${method} - ${response.status} - ${data.error?.message || 'Unknown error'}`
//     );
//   }

//   return data.result as T;
// };
