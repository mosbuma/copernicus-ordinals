import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { address } = await request.json();

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    // First check if the address has ever received any bitcoin
    const response = await fetch(process.env.BITCOIN_RPC_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:
          'Basic ' + btoa(`${process.env.BITCOIN_RPC_USER}:${process.env.BITCOIN_RPC_PASS}`),
      },
      body: JSON.stringify({
        jsonrpc: '1.0',
        id: 'curltext',
        method: 'getreceivedbyaddress',
        params: [address, 0], // 0 confirmations to include unconfirmed transactions
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const hasBeenUsed = data.result > 0;

    return NextResponse.json({
      hasBeenUsed,
      totalReceived: data.result,
    });
  } catch (error) {
    console.error('Error checking address usage:', error);
    return NextResponse.json({ error: 'Failed to check address usage' }, { status: 500 });
  }
}
