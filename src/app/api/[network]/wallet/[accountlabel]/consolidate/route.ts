import { NextResponse } from 'next/server';
import AccountStorage, { AccountLabel } from '@/lib/accountstorage';
import * as bitcoin from 'bitcoinjs-lib';
import {
  calculateTransactionSize,
  getMatureCoinbaseUtxos,
  getNetworkFeeRate,
  signAndBroadcastTransaction,
} from '../../utils';
import { makeRpcCall } from '@/app/lib/rpccall';
import { Network, getBitcoinNetwork } from '@/app/lib/networkUtils';
import { getWalletName } from '@/app/api/[network]/wallet/utils';
import { GetRawTransactionResponse } from '@/app/lib/bitcoinRpcTypes';
import { GetBlockHashResponse } from '@/app/lib/bitcoinRpcTypes';

const MAX_UTXOS_PER_CONSOLIDATION = 50;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ network: Network; accountlabel: AccountLabel }> }
) {
  try {
    const storage = AccountStorage.getInstance();
    const { network, accountlabel } = await params;
    const account = storage.getAccount(network, accountlabel);

    if (!account?.address) {
      return NextResponse.json(
        {
          error: 'Wallet not found',
          details: `No ${accountlabel} account exists`,
        },
        { status: 404 }
      );
    }

    const walletname = getWalletName(network);

    // Get mature coinbase UTXOs
    const matureUtxos = await getMatureCoinbaseUtxos(network, walletname, account.address);
    if (matureUtxos.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No mature coinbase UTXOs found to consolidate',
        },
        { status: 400 }
      );
    }

    // Take only the first MAX_UTXOS_PER_CONSOLIDATION UTXOs
    const utxosToConsolidate = matureUtxos.slice(0, MAX_UTXOS_PER_CONSOLIDATION);
    const remainingUtxos = matureUtxos.length - utxosToConsolidate.length;

    const bitcoinNetwork = getBitcoinNetwork(network);

    // Calculate total input amount and fee
    const feeRate = await getNetworkFeeRate(network);
    const psbt = new bitcoin.Psbt({ network: bitcoinNetwork });

    // Add all inputs
    let totalInputSats = 0;
    for (const utxo of utxosToConsolidate) {
      const blockHash = await makeRpcCall<GetBlockHashResponse>(network, 'getblockhash', [
        utxo.height,
      ]);
      const txData = await makeRpcCall<GetRawTransactionResponse>(network, 'getrawtransaction', [
        utxo.txid,
        true,
        blockHash,
      ]);

      psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        nonWitnessUtxo: Buffer.from(txData.hex, 'hex'),
        sequence: 0xffffffff,
      });
      totalInputSats += Math.round(utxo.amount * 100000000);
    }

    // Calculate fee based on transaction size (1 input, 1 output)
    const txSize = calculateTransactionSize(utxosToConsolidate.length, 1);
    const fee = txSize * feeRate;

    // Add single output with total amount minus fee
    const outputAmount = totalInputSats - fee;
    if (outputAmount <= 546) {
      // dust threshold
      return NextResponse.json(
        {
          success: false,
          error: 'Output amount would be below dust threshold after fees',
        },
        { status: 400 }
      );
    }

    psbt.addOutput({
      address: account.address,
      value: outputAmount,
    });

    // Sign and broadcast transaction
    const txid = await signAndBroadcastTransaction(psbt, account, network);

    return NextResponse.json({
      success: true,
      txid,
      consolidatedAmount: outputAmount / 100000000, // Convert back to BTC
      fee: fee / 100000000, // Convert back to BTC
      remainingUtxos, // Add count of remaining UTXOs
      processedUtxos: utxosToConsolidate.length, // Add count of processed UTXOs
    });
  } catch (error) {
    console.error('Error consolidating UTXOs:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to consolidate UTXOs',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
