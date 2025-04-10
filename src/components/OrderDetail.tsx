import { useCallback, useEffect, useState } from 'react';
import { InscribeOrderData } from '../utils/api-types';
import { handleError } from '../utils/utils';
import { api } from '../utils/api';
import { isOrderProcessing } from '../utils/orderUtils';
import { OrderStatus } from './OrderStatus';
import { OrderFiles } from './OrderFiles';
import { useUnisat } from '@/provider/UniSatProvider';

export function abbreviateHash(
  hash: string,
  startLength: number = 6,
  endLength: number = 6
): string {
  if (!hash || hash.length <= startLength + endLength) return hash;
  return `${hash.slice(0, startLength)}...${hash.slice(-endLength)}`;
}

interface SimpleRowProps {
  label: string;
  value: React.ReactNode;
}

function SimpleRow({ label, value }: SimpleRowProps) {
  return (
    <div className="flex justify-between items-center">
      <span className={`text-black font-medium text-xl`}>{label}</span>
      <span className={`text-black font-mono text-xl`}>{value}</span>
    </div>
  );
}

export function OrderDetail({ orderId, close }: { orderId: string; close: () => void }) {
  const { network } = useUnisat();
  const [order, setOrder] = useState<InscribeOrderData>();

  const refresh = useCallback(async () => {
    if (!orderId) return undefined;

    let orderInfo;
    try {
      orderInfo = await api.orderInfo(network, orderId);
      setOrder(orderInfo);
    } catch (e) {
      handleError(e);
    }
    return orderInfo;
  }, [orderId, network]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    refresh().then((data) => {
      if (!data) {
        handleError('Order does not exist');
        return close();
      }
      if (isOrderProcessing(data)) {
        timer = setInterval(() => {
          refresh().then((data) => {
            if (!data || !isOrderProcessing(data)) {
              if (timer) {
                clearInterval(timer);
                timer = null;
              }
            }
          });
        }, 5000);
      }
    });

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [refresh, close]);

  if (!orderId) return null;

  const receiveAddress = (
    <a
      href={`https://ordinals.com/address/${order?.receiveAddress}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      {abbreviateHash(order?.receiveAddress || '')}
    </a>
  );

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 z-40" onClick={close} />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="bg-white rounded-xl shadow-xl w-1/2 pointer-events-auto">
          {/* Modal Header */}
          <div className="px-6 py-4 flex justify-between items-center text-4xl">
            <h2 className={`font-semibold text-black text-4xl`}>Inscribe Job</h2>
            <button onClick={close} className="text-black hover:text-gray-300 focus:outline-none">
              <svg className={`h-8 w-8`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className={`flex flex-col`}>
            <div className="px-6 py-4 space-y-4">
              <SimpleRow value={abbreviateHash(orderId)} label="OrderId" />
              {!order ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-10 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-10 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-10 bg-gray-200 rounded w-2/3"></div>
                </div>
              ) : (
                <>
                  <SimpleRow
                    value={new Date(order.createTime).toLocaleString()}
                    label="Created At"
                  />
                  <SimpleRow value={order.status} label="Status" />
                  <SimpleRow value={abbreviateHash(order.payAddress)} label="Pay-To Address" />
                  <SimpleRow value={receiveAddress} label="Receive Address" />
                  <SimpleRow value={order.amount} label="Amount" />
                  <OrderStatus order={order} />
                </>
              )}
            </div>
          </div>
          {order && <OrderFiles order={order} />}
        </div>
      </div>
    </>
  );
}
