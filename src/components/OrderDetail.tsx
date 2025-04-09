import { useCallback, useEffect, useState } from 'react';
import { InscribeOrderData } from '../utils/api-types';
import { handleError } from '../utils/utils';
import { api } from '../utils/api';
import { isOrderProcessing } from '../utils/orderUtils';
import { OrderStatus } from './OrderStatus';
import { OrderFiles } from './OrderFiles';
import { useUnisat } from '@/provider/UniSatProvider';

function abbreviateHash(hash: string, startLength: number = 6, endLength: number = 6): string {
  if (!hash || hash.length <= startLength + endLength) return hash;
  return `${hash.slice(0, startLength)}...${hash.slice(-endLength)}`;
}

interface SimpleRowProps {
  label: string;
  value: React.ReactNode;
  valueSpan?: number;
  showFiles: boolean;
}

function SimpleRow({ label, value, showFiles }: SimpleRowProps) {
  return (
    <div className="flex justify-between items-center py-6">
      <span
        className={`text-gray-600 font-medium ${showFiles ? 'text-2xl lg:text-3xl' : 'text-3xl lg:text-4xl'}`}
      >
        {label}
      </span>
      <span
        className={`text-gray-900 font-mono ${showFiles ? 'text-2xl lg:text-3xl' : 'text-3xl lg:text-4xl'}`}
      >
        {value}
      </span>
    </div>
  );
}

export function OrderDetail({
  orderId,
  showFiles = false,
  close,
}: {
  orderId: string;
  showFiles: boolean;
  close: () => void;
}) {
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

  const renderBody = () => {
    /* Modal Body */
    return (
      <div className="px-12 py-8 space-y-8">
        <SimpleRow value={abbreviateHash(orderId)} label="OrderId" showFiles={showFiles} />
        {!order ? (
          <div className="animate-pulse space-y-8">
            <div className="h-10 bg-gray-200 rounded w-3/4"></div>
            <div className="h-10 bg-gray-200 rounded w-1/2"></div>
            <div className="h-10 bg-gray-200 rounded w-2/3"></div>
          </div>
        ) : (
          <>
            <SimpleRow
              value={new Date(order.createTime).toLocaleString()}
              label="Created At"
              showFiles={showFiles}
            />
            <SimpleRow value={order.status} label="Status" showFiles={showFiles} />
            <SimpleRow
              value={abbreviateHash(order.payAddress)}
              label="Pay-To Address"
              showFiles={showFiles}
            />
            <SimpleRow
              value={abbreviateHash(order.receiveAddress)}
              label="Receive Address"
              showFiles={showFiles}
            />
            <SimpleRow value={order.amount} label="Amount" showFiles={showFiles} />
            <OrderStatus order={order} />
          </>
        )}
      </div>
    );
  };

  const renderFiles = () => {
    if (!order) return null;

    return (
      <div className="px-12 py-8 border-t border-gray-200">
        <OrderFiles order={order} />
      </div>
    );
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 z-40" onClick={close} />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="bg-white rounded-xl shadow-xl w-1/2 pointer-events-auto">
          {/* Modal Header */}
          <div className="px-12 py-8 border-b border-gray-200 flex justify-between items-center text-4xl lg:text-3xl">
            <h2
              className={`font-semibold text-gray-800 ${showFiles ? 'text-4xl lg:text-5xl' : 'text-5xl lg:text-6xl'}`}
            >
              Inscribe Job
            </h2>
            <button
              onClick={close}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <svg
                className={`${showFiles ? 'h-8 w-8 lg:h-10 lg:w-10' : 'h-10 w-10 lg:h-12 lg:w-12'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className={`flex ${showFiles ? 'flex-row' : 'flex-col'}`}>
            <div className={`${showFiles ? 'w-2/3' : 'w-full'}`}>{renderBody()}</div>
            {showFiles && (
              <div className={`w-1/3 ${showFiles ? 'block' : 'hidden'} border-l border-gray-200`}>
                {renderFiles()}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
