import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import { InscribeOrderData } from '../utils/api-types';
import { abbreviateHash, OrderDetail } from '../components/OrderDetail';
import { handleError } from '../utils/utils';
import { useUnisat } from '../provider/UniSatProvider';
import { useEventEmitter } from '@/hooks/useEventEmitter';

const pageSize = 0;

interface OrderListProps {
  newOrder$: ReturnType<typeof useEventEmitter<void>>;
  setOrderId: (orderId: string) => void;
}

export function OrderList({ newOrder$, setOrderId }: OrderListProps) {
  const { network } = useUnisat();
  const [list, setList] = useState<InscribeOrderData[] | undefined>();
  const page = 1;
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.listOrder(network, {
        size: pageSize,
        cursor: (page - 1) * pageSize,
        sort: 'desc',
      });

      // filter out orders that are more than 4 hours old
      // status is one of 'pending', 'inscribing', 'minted', 'closed'
      const now = new Date();
      const horizon = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      const filteredOrders = res.list.filter((order) => {
        const orderDate = new Date(order.createTime);
        return (
          (orderDate >= horizon && ['pending', 'inscribing', 'minted'].includes(order.status)) ||
          showAll
        );
      });

      setList(filteredOrders);
      // setTotal(res.total);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [page, network, showAll]);

  // Fetch orders when page or network changes
  useEffect(() => {
    fetchOrders();
  }, [page, network, fetchOrders]);

  // Subscribe to new order events
  newOrder$.useSubscription(() => {
    fetchOrders();
  });

  const hasJobs = list?.length || 0 > 0;

  return (
    <div className="bg-gray-900 rounded-lg shadow-sm border border-gray-500 max-w-full mt-8">
      {/* Card Header */}
      <div className="px-6 py-4 border-b border-gray-500 flex justify-between items-center">
        <div className="text-lg font-semibold text-white">
          {hasJobs ? 'Inscribe Job List' : 'No Inscribe Jobs'}
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-white cursor-pointer">
            <input
              type="checkbox"
              checked={showAll}
              onChange={() => setShowAll(!showAll)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
            />
            All
          </label>
          <button
            onClick={fetchOrders}
            disabled={loading}
            className={`p-2 rounded-full ${loading ? 'bg-gray-800' : 'hover:bg-gray-800'} transition-colors text-white`}
          >
            <svg
              className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>
      <div className="px-6 py-4 border-b border-gray-500 flex justify-around items-center">
        <a
          href="https://mempool.space"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white hover:text-grey-700 underline cursor-pointer inline-flex items-center ml-4"
        >
          View Blocks @ mempool.space
        </a>
      </div>

      {/* Table */}
      <div className="overflow-x-auto min-w-[500px]">
        <table className="min-w-full divide-y divide-gray-500">
          {hasJobs && (
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  JobId
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Create Time
                </th>
              </tr>
            </thead>
          )}
          <tbody className="bg-gray-900 divide-y divide-gray-500">
            {loading ? (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-gray-300">
                  Loading...
                </td>
              </tr>
            ) : (
              list?.map((record) => (
                <tr
                  key={record.orderId}
                  onClick={() => setOrderId(record.orderId)}
                  className="hover:bg-gray-800 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {abbreviateHash(record.orderId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {record.status}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {new Date(record.createTime).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
