import { makeRpcCall, makeRpcCallWithWalletName } from '@/app/lib/rpccall';
import { Network, getBitcoinNetwork } from '@/app/lib/networkUtils';
import {
  WalletInfo,
  ListWalletsResponse,
  CreateWalletResponse,
  ImportDescriptorsResponse,
  LoadWalletResponse,
  UnloadWalletResponse,
  GetDescriptorInfoResponse,
  ListLabelsResponse,
  GenerateToAddressResponse,
  ListUnspentResponse,
} from '@/app/lib/bitcoinRpcTypes';

import ECPairFactory, { ECPairInterface } from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import * as bitcoin from 'bitcoinjs-lib';

import type { Account } from '@/lib/accountstorage';

const ECPair = ECPairFactory(ecc);

function tapTweakHash(pubKey: Buffer, h: Buffer | undefined): Buffer {
  return bitcoin.crypto.taggedHash('TapTweak', Buffer.concat(h ? [pubKey, h] : [pubKey]));
}

// function toXOnly(pubkey: Buffer): Buffer {
//   return pubkey.subarray(1, 33)
// }
function toXOnly(pubkey: Buffer): Buffer {
  return Buffer.from(pubkey.subarray(1, 33)); // drop 0x02 or 0x03 prefix and ensure Buffer
}

export const checkOrCreateWallet = async (
  network: Network,
  walletName: string
): Promise<boolean> => {
  try {
    // First check if wallet exists
    const loadedWallets = await makeRpcCall<ListWalletsResponse>(network, 'listwallets', []);
    console.log(
      `Loaded wallets: ${loadedWallets}`,
      loadedWallets.includes(walletName),
      loadedWallets[0] === walletName
    );
    if (!loadedWallets.includes(walletName)) {
      // Create a new descriptor wallet with private keys disabled
      console.log(`Creating new descriptor wallet: ${walletName}`);
      const createResult = await makeRpcCall<CreateWalletResponse>(network, 'createwallet', [
        walletName, // wallet name
        true, // disable_private_keys
        false, // blank
        null, // passphrase
        true, // avoid_reuse
        true, // descriptors
      ]);

      if (createResult.warning || createResult.name !== walletName) {
        throw new Error(`Unable to create ${walletName} was not created`);
      }

      const reloadedWallets = await makeRpcCall<ListWalletsResponse>(network, 'listwallets', []);
      if (!reloadedWallets.includes(walletName)) {
        const loadResult = await makeRpcCall<LoadWalletResponse>(network, 'loadwallet', [
          walletName,
        ]);
        if (loadResult.warning) {
          console.warn('Warning during wallet load:', loadResult.warning);
        }
      }
    }

    const isDescriptor = await verifyDescriptorWallet(network, walletName);
    if (!isDescriptor) {
      throw new Error(`Wallet ${walletName} was not created as a descriptor wallet`);
    }

    return true;
  } catch (error) {
    console.error('Error in checkOrCreateWallet:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    throw error;
  }
};

export const importTaprootAddress = async (
  network: Network,
  walletName: string,
  account: Account
) => {
  try {
    const existinglabels = await makeRpcCallWithWalletName<ListLabelsResponse>(
      network,
      'listlabels',
      [],
      walletName
    );
    if (existinglabels.includes(account.label)) {
      console.log('Descriptor already exists, skipping');
      return;
    }

    const descriptorNoChecksum = `tr(${account.pubkeyXOnly!})`;

    // Get descriptor with checksum
    const descriptorInfo = await makeRpcCall<GetDescriptorInfoResponse>(
      network,
      'getdescriptorinfo',
      [descriptorNoChecksum]
    );
    const descriptorWithChecksum = descriptorInfo.descriptor; // includes #checksum
    console.log('Descriptor:', descriptorWithChecksum);
    const params = [
      {
        desc: descriptorWithChecksum,
        timestamp: 'now',
        label: account.label,
      },
    ];
    const importResult = await makeRpcCallWithWalletName<ImportDescriptorsResponse>(
      network,
      'importdescriptors',
      [params],
      walletName
    );
    console.log('Import result:', importResult);

    return;
  } catch (error) {
    console.error('Error importing Taproot address:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    throw error;
  }
};

export const generateToAddress = async (network: Network, address: string, blocks: number = 1) => {
  try {
    const result = await makeRpcCall<GenerateToAddressResponse>(network, 'generatetoaddress', [
      blocks,
      address,
    ]);
    console.log(`*** GENERATE TO ADDRESS ***`, result);
    console.log(`Generated ${result.length} blocks to address ${address}`);
    return result;
  } catch (error) {
    console.error('Error in generateToAddress:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    throw error;
  }
};

export const verifyDescriptorWallet = async (
  network: Network,
  walletName: string
): Promise<boolean> => {
  try {
    // First ensure the wallet is loaded
    const loadedWallets = await makeRpcCall<ListWalletsResponse>(network, 'listwallets', []);
    if (!loadedWallets.includes(walletName)) {
      console.log(`Wallet ${walletName} not loaded, attempting to load it`);
      const loadResult = await makeRpcCall<LoadWalletResponse>(network, 'loadwallet', [walletName]);
      if (loadResult.warning) {
        console.warn('Warning during wallet load:', loadResult.warning);
      }
    }

    const walletInfo = await makeRpcCallWithWalletName<WalletInfo>(
      network,
      'getwalletinfo',
      [],
      walletName
    );
    console.log(`Full wallet info for ${walletName}:`, walletInfo);

    // Check both descriptor and private_keys_enabled flags
    const isDescriptor = walletInfo.descriptors;
    const privateKeysEnabled = walletInfo.private_keys_enabled;
    const walletType = walletInfo.format;

    console.log(`Wallet ${walletName} status:`, {
      isDescriptor,
      privateKeysEnabled,
      walletType,
    });

    // A wallet is considered a descriptor wallet if it has descriptors=true
    // and either private_keys_enabled=false or format="sqlite" (for descriptor wallets)
    return isDescriptor && (!privateKeysEnabled || walletType === 'sqlite');
  } catch (error) {
    console.error('Error verifying descriptor wallet:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      if (error.message.includes('Wallet file verification failed')) {
        // If wallet file is corrupted, try to unload and reload
        try {
          const unloadResult = await makeRpcCall<UnloadWalletResponse>(network, 'unloadwallet', [
            walletName,
          ]);
          if (unloadResult.warning) {
            console.warn('Warning during wallet unload:', unloadResult.warning);
          }
          const loadResult = await makeRpcCall<LoadWalletResponse>(network, 'loadwallet', [
            walletName,
          ]);
          if (loadResult.warning) {
            console.warn('Warning during wallet reload:', loadResult.warning);
          }
          console.log(`Successfully reloaded wallet ${walletName}`);
        } catch (reloadError) {
          console.error('Error reloading wallet:', reloadError);
        }
      }
    }
    return false;
  }
};

export interface CalculateFeeStatus {
  totalInputSats: number;
  amountInSats: number;
  inputCount: number;
  outputCount: number;
  feeRate: number;
}

function calculateTransactionSize(numInputs: number, numOutputs: number): number {
  // P2PKH sizes:
  // - Base transaction size: 10 bytes (version, locktime)
  // - Each input: 148 bytes (outpoint: 36, scriptSig: 107, sequence: 4, scriptSig length: 1)
  // - Each output: 34 bytes (value: 8, scriptPubKey: ~25, scriptPubKey length: 1)
  // - Input/Output count varints: 1-3 bytes each
  const baseSize = 10;
  const inputSize = 148;
  const outputSize = 34;
  const countSize = 2; // Assuming < 253 inputs/outputs

  return baseSize + countSize + inputSize * numInputs + outputSize * numOutputs;
}

// Track UTXOs and calculate size
export const trackUtxo = (status: CalculateFeeStatus) => {
  // We'll have 1 or 2 outputs (recipient + change if needed)
  //const outputCount = (totalInput * 100000000 - amountInSats) > 546 ? 2 : 1;
  const txSize = calculateTransactionSize(status.inputCount, status.outputCount);
  // console.log(`Estimated tx size with ${inputCount} inputs and ${outputCount} outputs: ${txSize} bytes`);
  return txSize * status.feeRate;
};

// export const fillFromOutsideUtxos = async (psbt: bitcoin.Psbt, network: Network, address: string, walletName: string, status: CalculateFeeStatus): Promise<boolean> => {
//   try {
//     const result = await makeRpcCallWithWalletName<ScanTxOutSetResponse>(network, 'scantxoutset', ['start', [`addr(${address})`]], walletName);
//     if(result.success) {
//       const currentHeight = await makeRpcCall<GetBlockCountResponse>(network, 'getblockcount', []);
//       if (!currentHeight) {
//         console.error('Error getting block height: No response');
//         return false;
//       }

//       for (const utxo of result.unspents.sort((a,b)=>b.amount-a.amount)) {
//         // Check coinbase maturity
//         if (currentHeight - utxo.height < 100) {
//           continue;
//         }

//         const blockHash = await makeRpcCall<GetBlockHashResponse>(network, 'getblockhash', [utxo.height]);
//         const txData = await makeRpcCall<GetRawTransactionResponse>(network, 'getrawtransaction', [utxo.txid, true, blockHash]);

//         psbt.addInput({
//           hash: utxo.txid,
//           index: utxo.vout,
//           nonWitnessUtxo: Buffer.from(txData.hex, 'hex'),
//           sequence: 0xffffffff
//         });
//         // Convert BTC to satoshis immediately when adding input
//         status.totalInputSats += Math.round(utxo.amount * 100000000);
//         status.inputCount++;
//         console.log(`Added coinbase input: ${utxo.txid} ${utxo.vout} ${utxo.amount} BTC (${Math.round(utxo.amount * 100000000)} sats)`);

//         // Calculate current fee based on actual transaction size
//         const currentFee = trackUtxo(status);
//         console.log(`Current total input: ${status.totalInputSats} sats, need: ${status.amountInSats + currentFee} sats`);

//         if (status.totalInputSats >= status.amountInSats + currentFee) {
//           break;
//         }
//       }
//       return true;
//     } else {
//       console.error('Error filling from coinbase UTXOs (scantxoutset):', result);
//       return false;
//     }
//   } catch (error) {
//     console.error('Error filling from coinbase UTXOs (other):', error);
//     return false
//   }
// }

function tweakSigner(keypair: ECPairInterface, opts: any = {}) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  let privateKey: Uint8Array | undefined = keypair.privateKey!;
  if (!privateKey) {
    throw new Error('Private key is required for tweaking signer!');
  }
  if (keypair.publicKey[0] === 3) {
    privateKey = ecc.privateNegate(privateKey);
  }

  const tweakedPrivateKey = ecc.privateAdd(
    privateKey,
    tapTweakHash(toXOnly(Buffer.from(keypair.publicKey)), opts.tweakHash)
  );
  if (!tweakedPrivateKey) {
    throw new Error('Invalid tweaked private key!');
  }

  return ECPair.fromPrivateKey(Buffer.from(tweakedPrivateKey), {
    network: opts.network,
  });
}

// export const fillFromRegularUtxos2 = async (psbt: bitcoin.Psbt, network: Network, account: Account, walletName: string, status: CalculateFeeStatus): Promise<boolean> => {
//   try {
//     bitcoin.initEccLib(ecc);
//     const ECPair = ECPairFactory(ecc);

//     const regularUtxos = await makeRpcCallWithWalletName<ListUnspentResponse>(network, 'listunspent', [0, 9999999, [account.address]], walletName);
//     console.log("Got", regularUtxos.length, "unspent transactions from listunspent");

//     const bitcoinnetwork = getBitcoinNetwork(network);
//     const keyPair = ECPair.fromWIF(account.privateKey, bitcoinnetwork);

//     // console.log("Debug - Account pubkeyXOnly:", account.pubkeyXOnly);
//     // console.log("Debug - KeyPair public key:", Buffer.from(keyPair.publicKey).toString('hex'));
//     // console.log("Debug - X-only from keyPair:", toXOnly(Buffer.from(keyPair.publicKey)).toString('hex'));

//     // function toXOnly(pubkey: Buffer): Buffer {
//     //   return pubkey.subarray(1, 33) // drop 0x02 or 0x03 prefix
//     // }

//     if (regularUtxos.length === 0) {
//       // console.log("!!!! No unspent transactions found through listunspent, trying scantxoutset");

//       // const scanResult = await makeRpcCall<ScanTxOutSetResponse>(network, "scantxoutset", ["start", [`addr(${account.address})`]]);
//       // if (scanResult.success) {
//       //   console.log("Got", scanResult.unspents.length, "unspent transactions from scantxoutset");

//       //   // Get current block height to check coinbase maturity
//       //   // const currentHeight = await makeRpcCall("getblockcount", []);

//       //   for (const utxo of scanResult.unspents) {
//       //     // Get transaction details to check if it's coinbase
//       //     const blockHash = await makeRpcCall<GetBlockHashResponse>(network, "getblockhash", [utxo.height]);
//       //     const txData = await makeRpcCall<GetRawTransactionResponse>(network, "getrawtransaction", [utxo.txid, true, blockHash]);

//       //     const script = bitcoin.payments.p2tr({
//       //       internalPubkey: xOnly,
//       //       network: bitcoin.networks.testnet
//       //     }).output!.toString('hex')

//       //     if (u.scriptPubKey !== script) {
//       //       // Skip coinbase transactions in regular UTXOs
//       //       continue;
//       //     }

//       //     psbt.addInput({
//       //       hash: utxo.txid,
//       //       index: utxo.vout,
//       //       nonWitnessUtxo: Buffer.from(txData.hex, 'hex'),
//       //       sequence: 0xffffffff
//       //     });
//       //     // Convert BTC to satoshis immediately when adding input
//       //     status.totalInputSats += Math.round(utxo.amount * 100000000);
//       //     status.inputCount++;
//       //     console.log(`Added input from scantxoutset: ${utxo.txid} ${utxo.vout} ${utxo.amount} BTC (${Math.round(utxo.amount * 100000000)} sats)`);

//       //     console.log("Signing input", psbt.txInputs.length-1);
//       //     psbt.signInput(psbt.txInputs.length-1, taprootSigner);
//       //     console.log("Finalizing input", psbt.txInputs.length-1);
//       //     psbt.finalizeInput(psbt.txInputs.length-1);
//       //     console.log("Finalized input", psbt.txInputs.length-1);
//       //     // Calculate current fee based on actual transaction size
//       //     const currentFee = trackUtxo(status);
//       //     console.log(`Current total input: ${status.totalInputSats} sats, need: ${status.amountInSats + currentFee} sats`);

//       //     if (status.totalInputSats >= status.amountInSats + currentFee) {
//       //       break;
//       //     }
//       //   }
//       // }
//       return false;
//     } else {
//       for (const utxo of regularUtxos) {
//         if(!utxo.spendable) {
//           console.log("****** Skipping utxo", utxo.address, "not spendable");
//           continue;
//         }

//         if(utxo.address !== account.address) {
//           console.log("****** Skipping utxo", utxo.address, " - mismatch of address");
//           continue;
//         }

//         // Decode the hex-encoded script and extract the x-only pubkey
//         const decodedUtxoPubkey = utxo.scriptPubKey.slice(4)

//         console.log("Debug - UTXO details:");
//         console.log("  txid:", utxo.txid);
//         console.log("  vout:", utxo.vout);
//         console.log("  amount:", utxo.amount);
//         console.log("  safe:", utxo.safe);
//         console.log("  scriptPubKey:", utxo.scriptPubKey);
//         console.log("  x-only pubkey:", decodedUtxoPubkey);

//         console.log("Debug - Account Details:");
//         console.log("  address:", account.address);
//         console.log("  x-only pubkey:", account.pubkeyXOnly);

//         // 2. Build expected scriptPubKey for P2TR (Taproot)
//         const { address: accountAddress, output: accountScript }  = bitcoin.payments.p2tr({
//           internalPubkey: Buffer.from(account.pubkeyXOnly, 'hex'),
//           // network: bitcoinnetwork, // same for all networks
//         })
//         console.log("  Account p2tr:");
//         console.log("    address address:", accountAddress);
//         console.log("    Decoded script:", accountScript?.toString('hex'))

//         console.log("  Assertions:");
//         console.log("    accountAddress:", accountAddress === account.address);
//         console.log("    accountScript:", accountScript?.toString('hex') === utxo.scriptPubKey);

//         const valueSats = Math.round(utxo.amount * 100000000); // must be a rounded value
//         console.log("Debug - Adding input with value:", valueSats, "sats");

//         // Create the witness UTXO with proper script
//         const witnessUtxo = {
//           script: Buffer.from(utxo.scriptPubKey, 'hex'),
//           value: valueSats
//         };

//         // Add input with all required data
//         psbt.addInput({
//           hash: utxo.txid,
//           index: utxo.vout,
//           witnessUtxo,
//           // tapInternalKey: Buffer.from(account.pubkeyXOnly, 'hex'),
//           tapInternalKey: toXOnly(Buffer.from(keyPair.publicKey)),
//           sequence: 0xffffffff
//         });

//         status.totalInputSats += valueSats;
//         status.inputCount++;

//         // console.log("Debug - PSBT input count:", psbt.txInputs.length);
//         // console.log("Debug - PSBT input data:", JSON.stringify(psbt.txInputs[psbt.txInputs.length - 1], null, 2));

//         const taprootSigner: bitcoin.Signer = {
//           publicKey: Buffer.from(account.pubkeyXOnly, 'hex'),
//           sign: (hash: Uint8Array): Buffer => {
//             console.log("Debug - Signing with hash:", Buffer.from(hash).toString('hex'));
//             const sig = Buffer.from(keyPair.sign(hash));
//             console.log("Debug - Generated signature:", sig.toString('hex'));
//             return sig;
//           },
//           signSchnorr: (hash: Buffer): Buffer => {
//             console.log("Debug - Signing Schnorr with hash:", Buffer.from(hash).toString('hex'));
//             const sig = Buffer.from(keyPair.signSchnorr(hash));
//             console.log("Debug - Generated Schnorr signature:", sig.toString('hex'));
//             return sig;
//           }
//         }

//         const tweakedSigner = tweakSigner(keyPair, { network: getBitcoinNetwork(network) });

//         console.log("Signing input", psbt.txInputs.length-1);
//         try {
//           psbt.signInput(psbt.txInputs.length-1, taprootSigner);
//           console.log("Successfully signed input");
//           psbt.finalizeInput(psbt.txInputs.length-1);
//           console.log("Successfully finalized input");
//         } catch (error) {
//           console.error("Error during signing:", error);
//           throw error;
//         }

//         // Calculate current fee based on actual transaction size
//         const currentFee = trackUtxo(status);
//         console.log(`Current total input: ${status.totalInputSats} sats, need: ${status.amountInSats + currentFee} sats`);

//         if (status.totalInputSats >= status.amountInSats + currentFee) {
//           break;
//         }
//       }
//     }

//     return true;
//   } catch (error) {
//     console.error('Error filling from regular UTXOs:', error);
//     return false;
//   }
// }

export const fillFromRegularUtxos = async (
  psbt: bitcoin.Psbt,
  network: Network,
  account: Account,
  walletName: string,
  status: CalculateFeeStatus
): Promise<boolean> => {
  try {
    bitcoin.initEccLib(ecc);
    const ECPair = ECPairFactory(ecc);

    const regularUtxos = await makeRpcCallWithWalletName<ListUnspentResponse>(
      network,
      'listunspent',
      [0, 9999999, [account.address]],
      walletName
    );
    // console.log("Got", regularUtxos.length, "unspent transactions from listunspent");

    console.log(
      regularUtxos
        .sort((a, b) => b.confirmations - a.confirmations)
        .map((utxo) => `${utxo.txid} ${utxo.vout} ${utxo.amount} ${utxo.confirmations}`)
    );

    // const bitcoinnetwork = getBitcoinNetwork(network);
    // const keyPair: ECPairInterface = ECPair.fromWIF(account.privateKey, bitcoinnetwork);
    // const keyPair: ECPairInterface = ECPair.fromWIF(account.privateKey, bitcoin.networks.regtest);
    const keyPair = ECPair.fromPrivateKey(Buffer.from(account.privateKey!, 'hex'), {
      network: getBitcoinNetwork(network),
    }); // or testnet/mainnet

    const filteredUtxos = regularUtxos.filter(
      (utxo) => utxo.spendable && utxo.address === account.address && utxo.confirmations > 100
    );
    console.log('Got', filteredUtxos.length, 'filtered unspent transactions');

    const eligibleUtxos = filteredUtxos.filter(
      (utxo) => utxo.amount * 100000000 > status.amountInSats + trackUtxo(status)
    );
    console.log('Got', eligibleUtxos.length, 'eligible unspent transactions');

    if (eligibleUtxos.length === 0) {
      console.error('No eligible unspent transactions found');
      return false;
    }

    const utxo = eligibleUtxos[0];

    const xOnlyPubkey = toXOnly(Buffer.from(keyPair.publicKey));
    console.log('Debug - network:', network);
    console.log('Debug - UTXO details:');
    console.log('  txid:', utxo.txid);
    console.log('  vout:', utxo.vout);
    console.log('  amount:', utxo.amount);
    console.log('  scriptPubKey:', utxo.scriptPubKey);

    // Extract the x-only pubkey from the scriptPubKey (for P2TR it's after the first 4 bytes)
    const expectedXOnlyPubkey = utxo.scriptPubKey.slice(4);
    console.log('  Expected x-only pubkey from UTXO:', expectedXOnlyPubkey);
    console.log('  Our x-only pubkey:', xOnlyPubkey.toString('hex'));

    // same for the utxo
    const { address: utxoAddress, output: utxoScript } = bitcoin.payments.p2tr({
      internalPubkey: Buffer.from(expectedXOnlyPubkey, 'hex'),
      network: getBitcoinNetwork(network),
    });
    console.log('  Derived address from UTXO:', utxoAddress);
    console.log('  Derived script from UTXO:', utxoScript?.toString('hex'));

    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        value: Math.round(utxo.amount * 100000000), // Convert to satoshis
        script: Buffer.from(utxo.scriptPubKey, 'hex'),
      },
      tapInternalKey: xOnlyPubkey,
    });

    // Create a proper Taproot signer
    const taprootSigner = {
      publicKey: xOnlyPubkey,
      sign: (hash: Uint8Array): Buffer => {
        return Buffer.from(keyPair.sign(hash));
      },
      signSchnorr: (hash: Buffer): Buffer => {
        return Buffer.from(keyPair.signSchnorr(hash));
      },
    };

    try {
      // Sign with the Taproot signer
      psbt.signInput(0, taprootSigner);
      console.log('Successfully signed input');
      psbt.finalizeInput(0);
      console.log('Successfully finalized input');
    } catch (error) {
      console.error('Error during signing:', error);
      throw error;
    }

    // Calculate current fee based on actual transaction size
    const currentFee = trackUtxo(status);
    console.log(
      `Current total input: ${status.totalInputSats} sats, need: ${status.amountInSats + currentFee} sats`
    );

    return true;
  } catch (error) {
    console.error('Error filling from regular UTXOs:', error);
    return false;
  }
};
