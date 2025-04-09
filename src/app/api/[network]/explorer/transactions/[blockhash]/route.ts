import { NextResponse } from 'next/server';
import { makeRpcCall } from '@/app/lib/rpccall';
import { GetBlockResponse, GetRawTransactionResponse } from '@/app/lib/bitcoinRpcTypes';
import { Network } from '@/app/lib/networkUtils';

export interface GetTransactionsResponse {
  transactions: GetRawTransactionResponse[];
}

export interface GetTransactionsParams {
  network: Network;
  blockhash: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<GetTransactionsParams> }
) {
  try {
    const { network, blockhash } = await params;

    console.log('Debug - Getting transactions for block hash:', blockhash);
    console.log('Debug - Network:', network);

    if (!blockhash) {
      return NextResponse.json({ error: 'Block hash is required' }, { status: 400 });
    }

    const block = await makeRpcCall<GetBlockResponse>(network, 'getblock', [blockhash, 2]); // 2 for verbose transaction info
    console.log('Debug - Block:', JSON.stringify(block.tx, null, 2));

    const transactions = await Promise.all(
      block.tx.map(async (tx) => {
        console.log('Debug - Transaction:', tx);
        const txDetails = await makeRpcCall<GetRawTransactionResponse>(
          network,
          'getrawtransaction',
          [tx.txid, true, blockhash]
        );
        return txDetails;
      })
    );

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch transactions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
