import { NextResponse } from 'next/server';
import { makeRpcCall } from '@/app/lib/rpccall';
import { Network } from '@/app/lib/networkUtils';
import {
  GetBlockHashResponse,
  GetRawTransactionResponse,
  ScanTxOutSetResponse,
} from '@/app/lib/bitcoinRpcTypes';

export interface TransactionResponse {
  success: boolean;
  transactions?: GetRawTransactionResponse[];
  addresses: string[];
  error?: string;
  details?: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ network: Network }> }
): Promise<NextResponse<TransactionResponse>> {
  try {
    const { network } = await params;
    const { searchParams } = new URL(request.url);
    const addresses = searchParams.get('addresses')?.split(',') || [];

    if (addresses.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No addresses provided and no wallet addresses found',
          addresses: [],
        },
        { status: 400 }
      );
    }

    // Create descriptors for each address
    const descriptors = addresses.map((addr) => `addr(${addr})`);

    // Scan UTXO set for all addresses in one call
    const scanResult = await makeRpcCall<ScanTxOutSetResponse>(network, 'scantxoutset', [
      'start',
      descriptors,
    ]);

    if (!scanResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to scan UTXO set',
          addresses: [],
        },
        { status: 500 }
      );
    }

    // If no UTXOs found, return empty transactions array
    if (!scanResult.unspents || scanResult.unspents.length === 0) {
      return NextResponse.json({
        success: true,
        transactions: [],
        addresses: addresses,
      });
    }

    // Process each UTXO
    const transactions = new Map<string, GetRawTransactionResponse>();
    for (const utxo of scanResult.unspents) {
      if (!transactions.has(utxo.txid)) {
        try {
          // Get block hash for the transaction
          const blockHash = await makeRpcCall<GetBlockHashResponse>(network, 'getblockhash', [
            utxo.height,
          ]);
          // Get full transaction details
          const txData = await makeRpcCall<GetRawTransactionResponse>(
            network,
            'getrawtransaction',
            [utxo.txid, true, blockHash]
          );
          transactions.set(utxo.txid, txData);
        } catch (error) {
          console.error(`Error fetching transaction ${utxo.txid}:`, error);
          // Continue with other transactions even if one fails
          continue;
        }
      }
    }

    return NextResponse.json({
      success: true,
      transactions: Array.from(transactions.values()),
      addresses: addresses,
    });
  } catch (error) {
    console.error('Error fetching address transactions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch transactions',
        addresses: [],
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
