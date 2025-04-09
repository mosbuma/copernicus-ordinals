import { InscribeOrderData } from '../utils/api-types';
import { useState } from 'react';
import { handleError } from '../utils/utils';
import { unisatUtils } from '../utils/unisatUtils';

export function OrderPay({ order }: { order: InscribeOrderData }) {
  const [paying, setPaying] = useState(false);

  async function pay() {
    // send the amount BTC to payAddress, then order will continue to process
    try {
      setPaying(true);
      await unisatUtils.sendBitcoin(order.payAddress, order.amount, order.feeRate);
    } catch (e) {
      handleError(e);
      setPaying(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="text-gray-600">Pay to Address</div>
        <div className="font-mono bg-gray-50 p-2 rounded">{order.payAddress}</div>
      </div>
      <div className="space-y-2">
        <div className="text-gray-600">Amount</div>
        <div className="font-mono bg-gray-50 p-2 rounded">{order.amount}</div>
      </div>
      <button
        disabled={paying}
        onClick={pay}
        className={`w-full py-2 px-4 rounded-md font-medium text-white 
                    ${
                      paying
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                    } transition-colors`}
      >
        {paying ? 'Processing...' : 'Pay'}
      </button>
    </div>
  );
}
