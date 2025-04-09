import { InscribeOrderData } from '../utils/api-types';
import { OrderPay } from './OrderPay';
import { OrderInscribing } from './OrderInscribing';

export function OrderStatus({ order }: { order: InscribeOrderData }) {
  if (order.status === 'closed')
    return (
      <p className="text-center bg-yellow-50 text-yellow-800 px-4 py-2 rounded-md border border-yellow-200">
        The order has been closed as payment was not made within 1 hour.
      </p>
    );

  if (order.status === 'pending') {
    return <OrderPay order={order} />;
  }

  if (order.status === 'minted' || order.status === 'inscribing') {
    return <OrderInscribing order={order} />;
  }

  // unknown status, loading
  return (
    <div className="flex justify-center items-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  );
}
