import { NextResponse } from 'next/server';
import { AccountLabel } from '@/lib/accountstorage';
import { makeRpcCall, makeRpcCallWithWalletName } from '@/app/lib/rpccall';
import { Network } from '@/app/lib/networkUtils';
import { ensureWalletExists } from '@/app/api/[network]/wallet/utils';
import { getWalletName } from '@/app/api/[network]/wallet/utils';
import {
  LoadWalletResponse,
  ScanTxOutSetResponse,
  GetBlockHashResponse,
  GetRawTransactionResponse,
  GetTxOutProofResponse,
  ImportPrunedFundsResponse,
  ImportDescriptorsResponse,
} from '@/app/lib/bitcoinRpcTypes';

async function importUtxosFromScan(network: Network, walletname: string, address: string) {
  try {
    // First, try to load the wallet
    try {
      const loadResult = await makeRpcCall<LoadWalletResponse>(network, 'loadwallet', [walletname]);
      if (loadResult.warning) {
        console.warn('Warning during wallet load:', loadResult.warning);
      }
    } catch (error) {
      // Ignore if wallet is already loaded
      if (!(error instanceof Error) || !error.message.includes('already loaded')) {
        throw error;
      }
    }

    // check if the address is known in the wallet
    const groupings = await makeRpcCall<unknown>(network, 'listdescriptors', []);
    console.log(`*** DESCRIPTORS ***`, groupings);
    return;
    // if (!isAddressKnown) {
    //   console.warn('Warning: Address is not known in the wallet');
    //   return;
    // }

    // Scan for UTXOs using scantxoutset
    const scanResult = await makeRpcCall<ScanTxOutSetResponse>(network, 'scantxoutset', [
      'start',
      [`addr(${address})`],
    ]);
    console.log('Scan result:', scanResult);

    if (!scanResult.success || scanResult.unspents.length === 0) {
      console.log('No UTXOs found for address:', address);
      return;
    }

    // Import each UTXO found
    console.log('Importing UTXOs:', scanResult.unspents.length);

    for (const utxo of scanResult.unspents) {
      try {
        console.log('Importing UTXO:', utxo);

        // const importResult = await makeRpcCallWithWalletName<ImportDescriptorsResponse>(network, "importdescriptors", [[{
        //   desc: `addr(${address})`, // can also use wpkh(...) for derived keys
        //   timestamp: utxo.height,
        //   active: false,
        //   watchonly: true
        // }]], walletname);

        // if (!importResult.success) {
        //   console.warn('Warning: UTXO import was not successful');
        // }
        // if (importResult.warnings?.length) {
        //   console.warn('Warnings during UTXO import:', importResult.warnings);
        // }

        const blockHash = await makeRpcCall<GetBlockHashResponse>(network, 'getblockhash', [
          utxo.height,
        ]);

        // Get the raw tx
        const rawTxHex = await makeRpcCall<GetRawTransactionResponse>(
          network,
          'getrawtransaction',
          [utxo.txid, false, blockHash]
        );

        // Get merkle proof
        const proof = await makeRpcCall<GetTxOutProofResponse>(network, 'gettxoutproof', [
          [utxo.txid],
          blockHash,
        ]);

        console.log(`*** RAW TX HEX ***`, rawTxHex);
        console.log(`*** PROOF ***`, proof);
        // // Import pruned funds
        const importPrunedResult = await makeRpcCallWithWalletName<ImportPrunedFundsResponse>(
          network,
          'importprunedfunds',
          [
            rawTxHex, // raw tx hex
            proof, // valid merkle proof
          ],
          walletname
        );

        if (!importPrunedResult.success) {
          console.warn('Warning: Pruned funds import was not successful', importPrunedResult);
        }

        // console.log(`✅ Successfully imported UTXO: ${utxo.txid}:${utxo.vout}`);
      } catch (error) {
        console.error(`❌ Error importing UTXO ${utxo.txid}:${utxo.vout}:`, error);
        continue;
      }
    }

    // Rescan blockchain for the imported transactions
    try {
      await makeRpcCallWithWalletName(
        network,
        'rescanblockchain',
        [Math.max(...scanResult.unspents.map((utxo) => utxo.height - 1))],
        walletname
      );
    } catch (error) {
      console.error('Error rescanning blockchain:', error);
    }

    // Get final balance after importing
    const balance = await makeRpcCallWithWalletName(network, 'getbalance', [], walletname);
    console.log(`Final wallet balance after import: ${balance} BTC`);
  } catch (error) {
    console.error('Error in importUtxosFromScan:', error);
    throw error;
  }
}

export async function POST(
  request: Request,
  { params }: { params: { type: AccountLabel; network: Network } }
) {
  try {
    const { network } = await params;
    const walletname = getWalletName(network);

    // Ensure wallet exists before proceeding
    await ensureWalletExists(network, walletname);

    const address = (await request.json()).address;
    if (address) {
      // First try importing with descriptors
      try {
        const importResult = await makeRpcCallWithWalletName<ImportDescriptorsResponse>(
          network,
          'importdescriptors',
          [
            [
              {
                desc: `addr(${address})`,
                timestamp: 'now',
                label: '',
                active: true,
                internal: false,
                watchonly: true,
              },
            ],
          ],
          walletname
        );

        if (!importResult.success) {
          console.warn('Warning: Address import was not successful');
        }
        if (importResult.warnings?.length) {
          console.warn('Warnings during address import:', importResult.warnings);
        }
      } catch (error) {
        console.error('Error importing with descriptors:', error);
      }

      // Then try importing UTXOs using scantxoutset and importprunedfunds
      await importUtxosFromScan(network, walletname, address);
    } else {
      return NextResponse.json(
        {
          error: 'Address is required',
          details: 'Address is required to rescan the wallet',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Wallet rescan completed',
    });
  } catch (error) {
    console.error('Error rescanning wallet:', error);
    return NextResponse.json(
      {
        error: 'Failed to rescan wallet',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
