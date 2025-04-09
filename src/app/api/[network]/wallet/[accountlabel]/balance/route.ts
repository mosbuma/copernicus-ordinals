import { NextResponse } from 'next/server';
import AccountStorage, { AccountLabel } from '@/lib/accountstorage';
import { makeRpcCall, makeRpcCallWithWalletName } from '@/app/lib/rpccall';
import { Network } from '@/app/lib/networkUtils';
import { getWalletName } from '@/app/api/[network]/wallet/utils';
import {
  ListWalletsResponse,
  LoadWalletResponse,
  // ImportDescriptorsResponse,
  ListUnspentResponse,
  ScanTxOutSetResponse,
  GetBlockCountResponse,
  GetBlockHashResponse,
  GetRawTransactionResponse,
  ListUnspentResponseItem,
} from '@/app/lib/bitcoinRpcTypes';

export interface BalanceInfo {
  balance: number;
  isUsed: boolean;
  balanceFromUtxos: number;
  balanceOutsideUtxos: number;
  balanceFromMatureCoinbaseUtxos: number;
  balanceFromImmatureCoinbaseUtxos: number;
}

async function getAddressInfo(
  network: Network,
  walletName: string,
  address: string
): Promise<BalanceInfo> {
  try {
    // First ensure the wallet is loaded
    try {
      const loadedWallets = await makeRpcCall<ListWalletsResponse>(network, 'listwallets', []);
      console.log('>>>> getAddressInfo- GOT LOADED WALLETS ', loadedWallets);
      if (!loadedWallets.includes(walletName)) {
        const loadResult = await makeRpcCall<LoadWalletResponse>(network, 'loadwallet', [
          walletName,
        ]);
        if (loadResult.warning) {
          console.warn('Warning during wallet load:', loadResult.warning);
        }
      }
    } catch (error) {
      console.error('Error loading wallet:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
      throw error;
    }

    // // Import the address if needed
    // try {
    //   const importResult = await makeRpcCallWithWalletName<ImportDescriptorsResponse>(network, "importdescriptors", [[{
    //     desc: `raw(addr(${address}))#h66l0qc6`,
    //     timestamp: "now",
    //     label: accountlabel,
    //     active: true,
    //     internal: false,
    //     range: null,
    //     next_index: null,
    //     watchonly: true
    //   }]], walletName);

    //   if (!importResult.success) {
    //     console.warn('Warning: Address import was not successful');
    //   }
    //   if (importResult.warnings?.length) {
    //     console.warn('Warnings during address import:', importResult.warnings);
    //   }
    // } catch (error) {
    //   console.error('Error importing address:', error);
    //   if (error instanceof Error) {
    //     console.error('Error details:', error.message);
    //   }
    //   // Continue even if import fails, as it might already be imported
    // }

    // // Get unspent transactions
    // console.log("&&&& GOT INFO ", network, address, walletName);

    let balanceFromUtxos = 0;
    let balanceOutsideUtxos = 0;
    let balanceFromMatureCoinbaseUtxos = 0;
    let balanceFromImmatureCoinbaseUtxos = 0;

    const unspent = await makeRpcCallWithWalletName<ListUnspentResponse>(
      network,
      'listunspent',
      [0, 9999999, [address]],
      walletName
    );
    console.log('&&&& GOT ', unspent.length, ' unspent transactions from listunspent');

    balanceFromUtxos = unspent.reduce(
      (sum: number, utxo: ListUnspentResponseItem) => sum + utxo.amount,
      0
    );

    // If no unspent outputs found through listunspent, try scantxoutset
    if (unspent.length === 0) {
      console.log('No unspent transactions found, trying scantxoutset');
      const scanResult = await makeRpcCall<ScanTxOutSetResponse>(network, 'scantxoutset', [
        'start',
        [`addr(${address})`],
      ]);

      if (scanResult.success) {
        console.log(
          '&&&& GOT ',
          scanResult.unspents.length,
          ' unspent transactions from scantxoutset'
        );

        // Get current block height to check coinbase maturity
        const currentHeight = await makeRpcCall<GetBlockCountResponse>(
          network,
          'getblockcount',
          []
        );

        for (const utxo of scanResult.unspents) {
          // Get transaction details to check if it's coinbase
          const blockHash = await makeRpcCall<GetBlockHashResponse>(network, 'getblockhash', [
            utxo.height,
          ]);
          const txData = await makeRpcCall<GetRawTransactionResponse>(
            network,
            'getrawtransaction',
            [utxo.txid, true, blockHash]
          );

          if (txData.vin && txData.vin[0].coinbase) {
            // This is a coinbase transaction
            if (currentHeight - utxo.height >= 100) {
              balanceFromMatureCoinbaseUtxos += utxo.amount;
            } else {
              balanceFromImmatureCoinbaseUtxos += utxo.amount;
            }
          } else {
            balanceOutsideUtxos += utxo.amount;
          }
        }
      }
    } else {
      // Process regular listunspent results
    }

    const totalBalance =
      balanceFromUtxos +
      balanceOutsideUtxos +
      balanceFromMatureCoinbaseUtxos +
      balanceFromImmatureCoinbaseUtxos;

    return {
      balance: totalBalance,
      isUsed: totalBalance > 0,
      balanceFromUtxos,
      balanceOutsideUtxos,
      balanceFromMatureCoinbaseUtxos,
      balanceFromImmatureCoinbaseUtxos,
    };
  } catch (error) {
    console.error('Error getting address info:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    throw error;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ network: Network; accountlabel: AccountLabel }> }
) {
  try {
    const storage = AccountStorage.getInstance();
    const { network, accountlabel } = await params;

    console.log(`>>>> GET BALANCE ${network}.${accountlabel}`);

    const account = storage.getAccount(network, accountlabel);

    if (!account?.address) {
      return NextResponse.json(
        {
          error: 'Account not found',
          details: `No ${accountlabel} account exists`,
        },
        { status: 404 }
      );
    }

    const walletname = getWalletName(network);
    const info = await getAddressInfo(network, walletname, account.address);
    console.log('>>>> GOT WALLETNAME', walletname);
    console.log('>>>> GOT ACCOUNT', account);
    console.log('>>>> GOT BALANCE INFO', info);

    return NextResponse.json(info);
  } catch (error) {
    console.error('Error getting balance:', error);
    return NextResponse.json(
      {
        error: 'Failed to get balance',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
