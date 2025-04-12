import { NextRequest, NextResponse } from 'next/server';
import { NetworkType } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { network: string; address: string } }
) {
  try {
    const { network, address } = params;
    const searchParams = request.nextUrl.searchParams;
    const offset = searchParams.get('offset') || '0';
    const limit = searchParams.get('limit') || '20';

    // Hiro API doesn't require network parameter as it's mainnet only
    const response = await fetch(
      `https://api.hiro.so/ordinals/v1/inscriptions?address=${address}&offset=${offset}&limit=${limit}`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch inscriptions');
    }

    const data = await response.json();
    return NextResponse.json({
      data: data.results,
      total: data.total,
      cursor: data.offset + data.limit,
    });
  } catch (error) {
    console.error('Error fetching inscriptions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch inscriptions' },
      { status: 500 }
    );
  }
}
