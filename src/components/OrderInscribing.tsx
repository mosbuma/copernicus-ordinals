import { InscribeOrderData } from '../utils/api-types';

interface SimpleRowProps {
  label: string;
  value: React.ReactNode;
}

function SimpleRow({ label, value }: SimpleRowProps) {
  return (
    <div className="flex justify-between items-center py-2">
      <span className="text-gray-600">{label}</span>
      <span>{value}</span>
    </div>
  );
}

export function OrderInscribing({ order }: { order: InscribeOrderData }) {
  return (
    <div className="space-y-4">
      <SimpleRow label="Paid Amount" value={order.paidAmount} />
      <SimpleRow
        label="Inscribe Process"
        value={
          <div className="flex gap-2">
            <span className="font-medium">
              {order.unconfirmedCount + order.confirmedCount}/{order.count}
            </span>
            <span className="text-gray-500">
              ({order.unconfirmedCount} Unconfirmed, {order.confirmedCount} Confirmed)
            </span>
          </div>
        }
      />
    </div>
  );
}
