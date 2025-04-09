import { getRpcConfig, Network } from '@/app/lib/networkUtils';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ network: Network }> }) {
  try {
    const network = (await params).network;
    const settings = getRpcConfig(network);

    const response = await fetch(settings.rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + btoa(`${settings.rpcUser}:${settings.rpcPass}`),
      },
      body: JSON.stringify({
        jsonrpc: '1.0',
        id: 'curltext',
        method: 'getblockcount',
        params: [],
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json({ blockHeight: data.result });
  } catch (error) {
    console.error('Error fetching block height:', error);
    return NextResponse.json({ error: 'Failed to fetch block height' }, { status: 500 });
  }
}
