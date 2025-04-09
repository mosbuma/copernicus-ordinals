import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import { ECPairFactory } from 'ecpair';
import { makeRpcCall, makeRpcCallWithWalletName } from '@/app/lib/rpccall';
import { getBitcoinNetwork, Network } from '@/app/lib/networkUtils';
import {
  ScanTxOutSetResponse,
  GetBlockHashResponse,
  GetRawTransactionResponse,
  SendRawTransactionResponse,
  EstimateSmartFeeResponse,
  GetBlockCountResponse,
  ListWalletsResponse,
  UnloadWalletResponse,
  CreateWalletResponse,
  ImportDescriptorsResponse,
} from '@/app/lib/bitcoinRpcTypes';

export interface ScanTxOutSetResult {
  success: boolean;
  searched_items: number;
  unspents: Array<{
    txid: string;
    vout: number;
    scriptPubKey: string;
    desc: string;
    amount: number;
    height: number;
  }>;
}

bitcoin.initEccLib(ecc);
const ECPair = ECPairFactory(ecc);

export const getWalletName = (network: Network) => {
  return `${network}-copernicus-wallet`;
};

export function validateAddress(address: string, network: bitcoin.networks.Network): boolean {
  try {
    bitcoin.address.toOutputScript(address, network);
    return true;
  } catch (e) {
    console.error('Address validation error:', e);
    return false;
  }
}

export function calculateTransactionSize(numInputs: number, numOutputs: number): number {
  // P2TR (Taproot) sizes:
  // - Base transaction size: 10 bytes (version, locktime)
  // - Each input: 58 bytes (outpoint: 36, sequence: 4, scriptSig length: 1, scriptSig: 16)
  // - Each output: 43 bytes (value: 8, scriptPubKey: 34, scriptPubKey length: 1)
  // - Input/Output count varints: 1-3 bytes each
  const baseSize = 10;
  const inputSize = 58; // Taproot input size
  const outputSize = 43; // Taproot output size
  const countSize = 2; // Assuming < 253 inputs/outputs

  return baseSize + countSize + inputSize * numInputs + outputSize * numOutputs;
}

export async function getNetworkFeeRate(network: Network): Promise<number> {
  // Set default fee rate based on network
  let feeRate: number;
  switch (network) {
    case 'REGTEST':
      feeRate = 1; // minimal fee rate for regtest
      break;
    case 'TEST':
      feeRate = 2; // minimal fee rate for testnet
      break;
    default:
      feeRate = 5; // conservative fee rate for mainnet
  }

  // Try to get dynamic fee estimate only for non-regtest networks
  if (network !== 'REGTEST') {
    try {
      const feeEstimate = await makeRpcCall<EstimateSmartFeeResponse>(network, 'estimatesmartfee', [
        6,
      ]);
      console.log('Fee estimate response:', feeEstimate);

      if (feeEstimate?.feerate) {
        // Convert BTC/kB to sat/vB
        feeRate = Math.ceil(feeEstimate.feerate * 100000); // 100000 = (100000000 / 1000)
        console.log(`Using estimated fee rate: ${feeRate} sat/vB`);
      } else {
        console.log(
          `Fee estimation failed or insufficient data, using default rate for ${network}: ${feeRate} sat/vB`
        );
      }
    } catch (error) {
      console.error('Error getting fee estimate:', error);
      console.log(`Using default fee rate for ${network}: ${feeRate} sat/vB`);
    }
  } else {
    console.log(`Using fee rate for regtest: ${feeRate} sat/vB`);
  }

  return feeRate;
}

export async function getMatureCoinbaseUtxos(
  network: Network,
  walletName: string,
  address: string
): Promise<ScanTxOutSetResponse['unspents']> {
  try {
    const coinbaseResult = await makeRpcCallWithWalletName<ScanTxOutSetResponse>(
      network,
      'scantxoutset',
      ['start', [`addr(${address})`]],
      walletName
    );
    if (!coinbaseResult.success) {
      throw new Error('Failed to scan UTXO set');
    }

    const currentHeight = await makeRpcCall<GetBlockCountResponse>(network, 'getblockcount', []);
    if (!currentHeight) {
      throw new Error('Failed to get current block height');
    }

    // Filter and sort UTXOs by amount (largest first)
    const matureUtxos = [];
    for (const utxo of coinbaseResult.unspents.sort((a, b) => b.amount - a.amount)) {
      // Check coinbase maturity
      if (currentHeight - utxo.height < 100) {
        continue;
      }

      const blockHash = await makeRpcCall<GetBlockHashResponse>(network, 'getblockhash', [
        utxo.height,
      ]);
      const txData = await makeRpcCall<GetRawTransactionResponse>(network, 'getrawtransaction', [
        utxo.txid,
        true,
        blockHash,
      ]);

      // Only include if it's a coinbase transaction
      if (txData.vin && txData.vin[0].coinbase) {
        matureUtxos.push(utxo);
      }
    }

    return matureUtxos;
  } catch (error) {
    console.error('Error getting mature coinbase UTXOs:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    throw error;
  }
}

export async function signAndBroadcastTransaction(
  psbt: bitcoin.Psbt,
  wallet: { privateKey: string },
  network: Network
): Promise<string> {
  try {
    // Determine if we need to convert the private key network
    const bitcoinNetwork = getBitcoinNetwork(network);
    // const keyPair = ECPair.fromWIF(wallet.privateKey, bitcoinNetwork);
    const keyPair = ECPair.fromPrivateKey(Buffer.from(wallet.privateKey!, 'hex'), {
      network: bitcoinNetwork,
    });

    // Sign all inputs with Taproot
    for (let i = 0; i < psbt.txInputs.length; i++) {
      // Create the taproot signer
      const signer = {
        publicKey: Buffer.from(keyPair.publicKey),
        sign: (hash: Uint8Array) => Buffer.from(keyPair.sign(hash)),
      };

      // Sign the input
      psbt.signInput(i, signer);
    }

    // Finalize all inputs
    psbt.finalizeAllInputs();

    // Get the raw transaction hex
    const tx = psbt.extractTransaction();
    const txHex = tx.toHex();

    // Broadcast the transaction
    const txid = await makeRpcCall<SendRawTransactionResponse>(network, 'sendrawtransaction', [
      txHex,
    ]);
    return txid.txid;
  } catch (error) {
    console.error('Error signing and broadcasting transaction:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    throw error;
  }
}

export const ensureWalletExists = async (network: Network, walletname: string) => {
  try {
    // First check if wallet is already loaded
    const loadedWallets = await makeRpcCall<ListWalletsResponse>(network, 'listwallets', []);
    if (loadedWallets.includes(walletname)) {
      console.log('Wallet already loaded');
      // Unload the wallet so we can reload it with rescan
      const unloadResult = await makeRpcCall<UnloadWalletResponse>(network, 'unloadwallet', [
        walletname,
      ]);
      if (unloadResult.warning) {
        console.warn('Warning during wallet unload:', unloadResult.warning);
      }
    }

    try {
      // Load wallet with rescan enabled
      await makeRpcCall(network, 'loadwallet', [walletname, true]); // Set rescan to true
      console.log('Wallet loaded successfully with rescan');
    } catch (error) {
      // If loading fails, create new wallet
      console.log('Creating new wallet...', error);
      const createResult = await makeRpcCall<CreateWalletResponse>(network, 'createwallet', [
        walletname,
        true, // disable_private_keys
        true, // blank
        null, // passphrase
      ]);
      if (createResult.warning) {
        console.warn('Warning during wallet creation:', createResult.warning);
      }
      console.log('Wallet created successfully');
    }
  } catch (error) {
    console.error('Error in ensureWalletExists:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    throw error;
  }
};

export const importAddress = async (
  network: Network,
  address: string,
  label: string,
  walletName: string
) => {
  try {
    // Create a descriptor for the address
    const descriptor = `addr(${address})`;

    // Use importdescriptors for descriptor wallets
    const importResult = await makeRpcCallWithWalletName<ImportDescriptorsResponse>(
      network,
      'importdescriptors',
      [
        [
          {
            desc: descriptor,
            timestamp: 'now',
            label: label,
            active: true,
          },
        ],
      ],
      walletName
    );

    if (!importResult.success) {
      throw new Error('Failed to import address');
    }
    if (importResult.warnings?.length) {
      console.warn('Warnings during address import:', importResult.warnings);
    }

    console.log(`Address ${address} imported successfully with label ${label}`);
  } catch (error) {
    console.error('Error in importAddress:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    throw error;
  }
};
