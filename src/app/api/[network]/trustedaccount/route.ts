import { NextRequest, NextResponse } from 'next/server';
import AccountStorage, { Account } from '@/lib/accountstorage';
import * as bitcoin from 'bitcoinjs-lib';
// import * as ecc from 'tiny-secp256k1';
import * as secp from '@bitcoinerlab/secp256k1';
import { ECPairFactory } from 'ecpair';
import { getBitcoinNetwork } from '@/app/lib/networkUtils';
import { NetworkType } from '@/types';
const accountlabel = 'trustedaccount';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ network: NetworkType }> }
) {
  const storage = AccountStorage.getInstance();
  const { network } = await params;
  const account = storage.getAccount(network, accountlabel);

  return NextResponse.json(
    {
      address: account?.address || '',
    },
    { status: 200 }
  );
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ network: NetworkType }> }
) {
  try {
    const { network } = await params;

    console.debug('*** POST network', network);

    const ECPair = ECPairFactory(secp);
    bitcoin.initEccLib(secp);
    const bitcoinNetwork = getBitcoinNetwork(network);
    const keyPair = ECPair.makeRandom({ network: bitcoinNetwork });
    const privateKey = keyPair.privateKey;
    const publicKey = keyPair.publicKey;
    //const privateKey = keyPair.toWIF();

    // Verify it's a valid Schnorr key (taproot-compatible)
    if (!secp.isPrivate(Buffer.from(privateKey!))) {
      throw new Error('Invalid private key for Schnorr signature');
    }

    console.log('Private Key:', Buffer.from(privateKey!).toString('hex'));
    console.log('Public Key:', Buffer.from(publicKey).toString('hex'));

    // Create a P2TR (Taproot) address
    const { address } = bitcoin.payments.p2tr({
      internalPubkey: Buffer.from(keyPair.publicKey.slice(1, 33)), // Remove the first byte (0x02 or 0x03)
      network: bitcoinNetwork,
    });

    // const p2tr = bitcoin.payments.p2tr({
    //   internalPubkey: Buffer.from(publicKey.slice(1, 33)), // 32-byte x-only pubkey
    //   network: bitcoin.networks.bitcoin,
    // });

    // const { address, payment } = p2tr;

    if (!address) {
      throw new Error('Failed to generate address');
    }

    // Store both address and private key
    const storage = AccountStorage.getInstance();
    const account: Account = {
      label: accountlabel,
      address,
      privateKey: Buffer.from(privateKey!).toString('hex'),
      pubkeyXOnly: Buffer.from(keyPair.publicKey.slice(1, 33)).toString('hex'),
    };
    storage.setAccount(network, account);

    return NextResponse.json({ address: account.address }, { status: 201 });
  } catch (error) {
    console.error('Error creating address:', error);
    return NextResponse.json({ error: 'Failed to create address' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ network: NetworkType }> }
) {
  try {
    const storage = AccountStorage.getInstance();
    const { network } = await params;
    storage.resetAccount(network, accountlabel);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error resetting address:', error);
    return NextResponse.json({ error: 'Failed to reset address' }, { status: 500 });
  }
}
