import { NextResponse } from 'next/server';
import { makeRpcCall } from '@/app/lib/rpccall';
import { Network } from '@/app/lib/networkUtils';
import {
  GetBlockCountResponse,
  GetBlockHashResponse,
  GetBlockResponse,
} from '@/app/lib/bitcoinRpcTypes';
export async function GET(request: Request, { params }: { params: Promise<{ network: Network }> }) {
  try {
    const network = (await params).network;
    // Get current block count
    const blockCount = await makeRpcCall<GetBlockCountResponse>(network, 'getblockcount', []);

    // Fetch last 100 blocks
    const blocks = [];
    for (let height = blockCount; height > Math.max(0, blockCount - 1000); height--) {
      const hash = await makeRpcCall<GetBlockHashResponse>(network, 'getblockhash', [height]);
      const block = await makeRpcCall<GetBlockResponse>(network, 'getblock', [hash]);
      blocks.push(block);
    }

    return NextResponse.json({ blocks });
  } catch (error) {
    console.error('Error fetching blocks:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch blocks',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
