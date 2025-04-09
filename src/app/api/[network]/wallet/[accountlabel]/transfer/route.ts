import { NextResponse } from 'next/server';
import { makeRpcCall } from '@/app/lib/rpccall';
import AccountStorage, { AccountLabel } from '@/lib/accountstorage';
import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
// import { ECPairFactory } from 'ecpair';
import { getBitcoinNetwork, Network } from '@/app/lib/networkUtils';
import { getWalletName } from '@/app/api/[network]/wallet/utils';
import { EstimateSmartFeeResponse, SendRawTransactionResponse } from '@/app/lib/bitcoinRpcTypes';
import {
  fillFromRegularUtxos,
  fillFromOutsideUtxos,
  trackUtxo,
  CalculateFeeStatus,
} from '@/app/lib/wallet-utils';

function validateAddress(address: string, network: bitcoin.networks.Network): boolean {
  try {
    bitcoin.address.toOutputScript(address, network);
    return true;
  } catch (e) {
    console.error('Address validation error:', e);
    return false;
  }
}

bitcoin.initEccLib(ecc);
// const ECPair = ECPairFactory(ecc);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ network: Network }> }
) {
  try {
    const json = await request.json();
    console.log(`Received request: ${JSON.stringify(json)}`);
    const { toAddress, amount, walletType } = json;
    const { network: networkParam } = await params;

    if (!toAddress || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid transfer parameters' },
        { status: 400 }
      );
    }

    const bitcoinnetwork = getBitcoinNetwork(networkParam);
    // Validate the address format
    console.log(
      `Validating address ${toAddress} on ${networkParam} network, bitcoinnetwork: ${bitcoinnetwork}`
    );
    if (!validateAddress(toAddress, bitcoinnetwork)) {
      return NextResponse.json(
        { success: false, error: `Invalid Bitcoin address format for ${networkParam} network` },
        { status: 400 }
      );
    }

    // Get the account from storage
    const storage = AccountStorage.getInstance();
    const account = storage.getAccount(networkParam, walletType as AccountLabel);

    if (!account) {
      return NextResponse.json({ success: false, error: 'Wallet not found' }, { status: 400 });
    }

    const walletName = getWalletName(networkParam);

    const status: CalculateFeeStatus = {
      totalInputSats: 0,
      amountInSats: Math.round(amount * 100000000),
      inputCount: 0,
      outputCount: 2,
      feeRate: 0,
    };

    // Set default fee rate based on network
    switch (networkParam) {
      case 'REGTEST':
        status.feeRate = 1; // minimal fee rate for regtest
        break;
      case 'TEST':
        status.feeRate = 2; // minimal fee rate for testnet
        break;
      default:
        status.feeRate = 5; // conservative fee rate for mainnet
    }

    // Try to get dynamic fee estimate only for non-regtest networks
    if (networkParam !== 'REGTEST') {
      const feeEstimate = await makeRpcCall<EstimateSmartFeeResponse>(
        networkParam,
        'estimatesmartfee',
        [6]
      );
      console.log('Fee estimate response:', feeEstimate);

      if (feeEstimate?.feerate) {
        // Convert BTC/kB to sat/vB
        status.feeRate = Math.ceil(feeEstimate.feerate * 100000); // 100000 = (100000000 / 1000)
        // console.log(`Using estimated fee rate: ${status.feeRate} sat/vB`);
      } else {
        console.warn(
          `Fee estimation failed or insufficient data, using default rate for ${networkParam}: ${status.feeRate} sat/vB`
        );
      }
    } else {
      // console.log(`Using fee rate for regtest: ${status.feeRate} sat/vB`);
    }

    const psbt = new bitcoin.Psbt({ network: bitcoinnetwork });

    if (false === (await fillFromRegularUtxos(psbt, networkParam, account, walletName, status))) {
      console.warn('Unable to fill from regular UTXOs');
      return NextResponse.json(
        { success: false, error: 'Unable to fill from regular UTXOs' },
        { status: 400 }
      );
    }

    // if (status.totalInputSats < status.amountInSats + trackUtxo(status)) {
    //   console.warn("Unable to fill from regular UTXOs, trying coinbase UTXOs");
    //   if(false === await fillFromOutsideUtxos(psbt, networkParam, account.address, walletName, status)) {
    //     return NextResponse.json({ success: false, error: 'Unable to fill from coinbase UTXOs' }, { status: 400 });
    //   }
    // }

    if (status.totalInputSats < status.amountInSats + trackUtxo(status)) {
      console.warn(
        'Unable to fill from regular UTXOs or coinbase UTXOs',
        status.totalInputSats,
        status.amountInSats + trackUtxo(status)
      );
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient funds',
          details: `Have ${status.totalInputSats} sats, need ${status.amountInSats + trackUtxo(status)} sats (${status.amountInSats} + ${trackUtxo(status)} fee)`,
        },
        { status: 400 }
      );
    }

    // Add outputs
    psbt.addOutput({
      address: toAddress,
      value: status.amountInSats,
    });

    // Add change output if needed
    const changeAmount = status.totalInputSats - status.amountInSats - trackUtxo(status);
    if (changeAmount > 546) {
      // dust threshold
      psbt.addOutput({
        address: account.address,
        value: changeAmount,
      });
    }

    // log transaction core parameters: ninputs, noutputs, fee, change, amount
    console.log('Transaction core parameters:', {
      inputs: psbt.txInputs.length,
      outputs: psbt.txOutputs.map((o) => {
        return {
          address: o.address,
          value: o.value,
        };
      }),
      fee: trackUtxo(status),
      change: changeAmount,
      amount: status.amountInSats,
      totalInput: status.totalInputSats,
    });

    try {
      //   // Sign all inputs
      //   console.log('Network type:', networkParam);
      //   console.log('Wallet name:', walletName);

      //   // Log input details before signing
      //   console.log('Input details:', psbt.txInputs.map((input, idx) => ({
      //     inputIndex: idx,
      //     hash: input.hash.toString('hex'),
      //     index: input.index,
      //     sequence: input.sequence
      //   })));

      //   // Get the input's UTXO data
      //   console.log('Input hash:', psbt.txInputs[0].hash.toString('hex'));
      //   const inputUtxo = await makeRpcCallWithWalletName<RawTransaction>(networkParam, 'getrawtransaction', [psbt.txInputs[0].hash.toString('hex'), true], walletName);
      //   console.log('Input UTXO:', inputUtxo);

      //   // Set up the witness UTXO for Taproot
      //   const witnessUtxo = {
      //     script: Buffer.from(inputUtxo.vout[psbt.txInputs[0].index].scriptPubKey.hex, 'hex'),
      //     value: inputUtxo.vout[psbt.txInputs[0].index].value * 100000000 // Convert BTC to sats
      //   };
      //   psbt.addInput({
      //     hash: psbt.txInputs[0].hash,
      //     index: psbt.txInputs[0].index,
      //     sequence: psbt.txInputs[0].sequence,
      //     witnessUtxo
      //   });

      //   // Sign locally using the private key
      //   const keyPair = ECPair.fromWIF(account.privateKey, bitcoinnetwork);
      //   console.log('Public key:', Buffer.from(keyPair.publicKey).toString('hex'));

      //   const signer = {
      //     publicKey: Buffer.from(keyPair.publicKey),
      //     sign: (hash: Uint8Array) => Buffer.from(keyPair.sign(hash))
      //   };

      //   console.log('Signing transaction...');
      //   psbt.signAllInputs(signer as unknown as bitcoin.Signer);

      //   // Check if inputs were signed
      //   const signedInputs = psbt.txInputs.filter(input => {
      //     const psbtInput = input as unknown as { partialSig?: Array<{ pubkey: Buffer; signature: Buffer }> };
      //     return psbtInput.partialSig && psbtInput.partialSig.length > 0;
      //   });
      //   console.log('Number of signed inputs:', signedInputs.length);
      //   console.log('Partial signatures:', signedInputs.map(input => {
      //     const psbtInput = input as unknown as { partialSig?: Array<{ pubkey: Buffer; signature: Buffer }> };
      //     return psbtInput.partialSig;
      //   }));

      // psbt.finalizeAllInputs();
      // console.log('Transaction finalized');

      psbt.finalizeAllInputs();

      // Get the raw transaction hex
      const tx = psbt.extractTransaction();
      const txHex = tx.toHex();
      console.log('Transaction hex:', txHex);

      // Broadcast the transaction
      const txid = await makeRpcCall<SendRawTransactionResponse>(
        networkParam,
        'sendrawtransaction',
        [txHex]
      );
      console.log('Transaction sent:', txid);

      return NextResponse.json({
        success: true,
        txid: txid.txid,
      });
    } catch (error) {
      console.error('Unable to sign transaction:', error);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to sign transaction (${error})`,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Transfer error:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to transfer funds (${error})`,
      },
      { status: 500 }
    );
  }
}
