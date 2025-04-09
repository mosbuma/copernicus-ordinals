import { NextResponse } from 'next/server';
import AccountStorage, { AccountLabel } from '@/lib/accountstorage';
import { Network } from '@/app/lib/networkUtils';
import { makeRpcCall } from '@/app/lib/rpccall';
import { getWalletName } from '../../wallet/utils';
import { GetRawTransactionResponse } from '@/app/lib/bitcoinRpcTypes';
export interface TestResponse {
  success: boolean;
  error?: string;
  details?: string;
}

const testTransfer = async (network: Network) => {
  const txid = '64bda28482258d1d942014ee264d5b1e96d5e18a4cdc1b0d37e1b49a3d6ff5e9';
  const txData = await makeRpcCall<GetRawTransactionResponse>(network, 'getrawtransaction', [
    txid,
    true,
    blockHash,
  ]);

  // get the utxo from the network

  const utxo = await makeRpcCall<GetRawTransactionResponse>(Network.REGTEST, 'getrawtransaction', [
    '64bda28482258d1d942014ee264d5b1e96d5e18a4cdc1b0d37e1b49a3d6ff5e9',
    true,
  ]);
  console.log(`*** UTXO ***`, utxo);
  return;

  // Debug - network: REGTEST
  // Debug - UTXO details:
  //   txid: 64bda28482258d1d942014ee264d5b1e96d5e18a4cdc1b0d37e1b49a3d6ff5e9
  //   vout: 0
  //   amount: 50
  //   scriptPubKey: 51208d97130309446fa887df80a0bc74e933460de6dec36290102905a3993231b9b7
  //   Expected x-only pubkey from UTXO: 8d97130309446fa887df80a0bc74e933460de6dec36290102905a3993231b9b7
  //   Our x-only pubkey: ea07457552b1549515500f1729c14e91a29a0f21d06e574dbb68f31e6437b87c
  //   Our walletname: REGTEST-copernicus-wallet
  //   Our account label: bank
  // Debug - Key derivation:
  //   Full public key: 02ea07457552b1549515500f1729c14e91a29a0f21d06e574dbb68f31e6437b87c
  //   Account address: bcrt1p3kt3xqcfg3h63p7lszstca8fxdrqmek7cd3fqypfqk3ejv33hxmsyaucux
  //   Account pubkeyXOnly: ea07457552b1549515500f1729c14e91a29a0f21d06e574dbb68f31e6437b87c
  //   Derived address from our key: bcrt1p3kt3xqcfg3h63p7lszstca8fxdrqmek7cd3fqypfqk3ejv33hxmsyaucux
  //   Derived script from our key: 51208d97130309446fa887df80a0bc74e933460de6dec36290102905a3993231b9b7
  // Debug - Tweak:
  //   Full public key: 02d0e79ddee0b0c253f075af86d401a9198c0590244acf9e7d24dcfd66f38e6738
  //   Private key: 8343b8b349e33044b9a758e670e541b123c0d71a765c6b65efb90e371e931074
  //   Account's stored x-only pubkey: ea07457552b1549515500f1729c14e91a29a0f21d06e574dbb68f31e6437b87c
  //   Matches our derived x-only pubkey: true
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ network: Network; accountlabel: AccountLabel }> }
) {
  try {
    const storage = AccountStorage.getInstance();
    const { accountlabel, network } = await params;
    const walletName = getWalletName(network);

    const account = storage.getAccount(network, accountlabel);
    if (!account) {
      return NextResponse.json(
        {
          success: false,
          error: 'Account not found',
          details: `No account found for network ${network} and type ${accountlabel}`,
        },
        { status: 404 }
      );
    }

    //await importTaprootAddress(network, walletName, account);

    // // check of the given accountlabel exists in the wallet
    // const descriptors = await makeRpcCall<unknown>(network, "listdescriptors", []);
    // console.log(`*** DESCRIPTORS ***`, descriptors);

    // // import the given accountlabel
    // await importTaprootAddress(network, walletName, account);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error getting account:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get wallet',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
