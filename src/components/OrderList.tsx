import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import { InscribeOrderData } from '../utils/api-types';
import { OrderDetail } from '../components/OrderDetail';
import { handleError } from '../utils/utils';
import { useUnisat } from '../provider/UniSatProvider';
import { useEventEmitter } from '@/hooks/useEventEmitter';

const pageSize = 10;

interface OrderListProps {
  newOrder$: ReturnType<typeof useEventEmitter<void>>;
}

export function OrderList({ newOrder$ }: OrderListProps) {
  const { network } = useUnisat();
  const [list, setList] = useState<InscribeOrderData[] | undefined>();
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [orderId, setOrderId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.listOrder(network, {
        size: pageSize,
        cursor: (page - 1) * pageSize,
        sort: 'desc',
      });
      setList(res.list);
      setTotal(res.total);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [page, network]);

  // Fetch orders when page or network changes
  useEffect(() => {
    fetchOrders();
  }, [page, network, fetchOrders]);

  // Subscribe to new order events
  newOrder$.useSubscription(() => {
    fetchOrders();
  });

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Card Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Order List</h2>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className={`p-2 rounded-full ${loading ? 'bg-gray-100' : 'hover:bg-gray-100'} transition-colors`}
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

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                OrderId
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Create Time
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : (
              list?.map((record) => (
                <tr
                  key={record.orderId}
                  onClick={() => setOrderId(record.orderId)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.orderId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.status}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(record.createTime).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className={`px-3 py-1 rounded ${page === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white hover:bg-gray-50 text-gray-700'} border border-gray-300`}
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className={`px-3 py-1 rounded ${page >= totalPages ? 'bg-gray-100 text-gray-400' : 'bg-white hover:bg-gray-50 text-gray-700'} border border-gray-300`}
          >
            Next
          </button>
        </div>
      </div>

      {/* Order Detail Modal */}
      {orderId && <OrderDetail orderId={orderId} close={() => setOrderId('')} />}
    </div>
  );
}
