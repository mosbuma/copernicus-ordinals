import { NextResponse } from 'next/server';
import AccountStorage, { Account, AccountLabel } from '@/lib/accountstorage';
import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import { ECPairFactory } from 'ecpair';
import { Network } from '@/app/lib/networkUtils';
import { getBitcoinNetwork } from '@/app/lib/networkUtils';
import { getWalletName } from '@/app/api/[network]/wallet/utils';
import { importTaprootAddress, checkOrCreateWallet } from '@/app/lib/wallet-utils';

const ECPair = ECPairFactory(ecc);
export interface CreateAccountResponse {
  account: Account;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ network: Network; accountlabel: string }> }
) {
  try {
    const { accountlabel, network } = await params;

    const walletname = getWalletName(network);

    // check if wallet exists and is a descriptor wallet
    try {
      await checkOrCreateWallet(network, walletname);
    } catch (error) {
      console.error('Error checking or creating wallet:', error);
      return NextResponse.json(
        {
          error: 'Failed to create wallet',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }

    // Create a new key pair with the correct network
    bitcoin.initEccLib(ecc);
    const bitcoinNetwork = getBitcoinNetwork(network);
    const keyPair = ECPair.makeRandom({ network: bitcoinNetwork });
    const privateKey = keyPair.privateKey;
    const publicKey = keyPair.publicKey;
    //const privateKey = keyPair.toWIF();

    // Verify it's a valid Schnorr key (taproot-compatible)
    if (!ecc.isPrivate(Buffer.from(privateKey!))) {
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

    // Import the Taproot address with proper labeling
    await importTaprootAddress(network, walletname, account);

    return NextResponse.json({
      account: {
        address,
        isDescriptor: true,
        label: accountlabel,
      },
    }); // Note: We don't return the private key in the response for security
  } catch (error) {
    console.error('Error creating account:', error);
    return NextResponse.json(
      {
        error: 'Failed to create wallet',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ network: Network; accountlabel: AccountLabel }> }
) {
  try {
    const storage = AccountStorage.getInstance();
    const { network, accountlabel } = await params;
    const account = storage.getAccount(network, accountlabel);

    if (!account) {
      return NextResponse.json(
        {
          error: 'Account not found',
          details: `No account found for network ${network} and type ${accountlabel}`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      account: account,
    });
  } catch (error) {
    console.error('Error getting account:', error);
    return NextResponse.json(
      {
        error: 'Failed to get wallet',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ network: Network; accountlabel: AccountLabel }> }
) {
  try {
    const storage = AccountStorage.getInstance();
    const { network, accountlabel } = await params;
    storage.resetAccount(network, accountlabel);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete wallet',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
