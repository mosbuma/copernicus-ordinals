import { NextResponse } from 'next/server';
import AccountStorage, { AccountLabel } from '@/lib/accountstorage';
import { generateToAddress } from '@/app/lib/wallet-utils';
import { Network } from '@/app/lib/networkUtils';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ network: Network; accountlabel: AccountLabel }> }
) {
  try {
    const { network, accountlabel } = await params;
    const storage = AccountStorage.getInstance();
    const account = storage.getAccount(network, accountlabel);

    if (!account?.address) {
      return NextResponse.json(
        {
          error: `No ${accountlabel} account address found`,
        },
        { status: 400 }
      );
    }

    // Generate new block for funding via blockreward
    console.log('>>> Generating blocks for funding on ', network);
    const generatedBlocks = await generateToAddress(network, account.address, 100);
    console.log('>>> Generated blocks:', generatedBlocks);

    return NextResponse.json({
      success: true,
      data: {
        generatedBlocks,
        // balance
      },
    });
  } catch (error) {
    console.error('Error funding wallet:', error);
    return NextResponse.json(
      {
        error: 'Failed to fund wallet',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
