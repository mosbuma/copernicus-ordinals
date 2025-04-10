import { CreateOrderReq } from '@/utils/api-types';
import Button from './ui/Button';
import { useState } from 'react';
import { abbreviateHash } from './OrderDetail';
import Image from 'next/image';

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

export function ConfirmInscribe({
  settings,
  close,
  onLaunchJob,
}: {
  settings: CreateOrderReq;
  close: () => void;
  onLaunchJob: (settings: CreateOrderReq) => void;
}) {
  const [feeRate, setFeeRate] = useState<number>(settings.feeRate);

  if (!settings) return null;

  console.log('settings', settings);

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 z-40" onClick={close} />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="bg-white rounded-xl shadow-xl w-1/2 pointer-events-auto">
          {/* Modal Header */}
          <div className="px-6 py-4 flex justify-between items-center text-4xl">
            <h2 className={`font-semibold text-black text-4xl`}>Confirm Inscribe Job</h2>
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
              <div className="flex flex-col space-y-2 justify-center items-center">
                <span className="text-black font-medium text-xl">Ordinal #1 Preview</span>
                <div className="flex items-center space-x-4">
                  <div className="relative w-48 h-48 bg-gray-100 rounded-lg">
                    <Image
                      src={settings.files[0].dataURL}
                      alt={settings.files[0].filename}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <span className="text-black font-mono text-sm">{settings.files[0].filename}</span>
                </div>
              </div>
              <SimpleRow
                value={abbreviateHash(settings.receiveAddress)}
                label="Destination Address"
              />
              <SimpleRow value={settings.files.length} label="Number of Ordinals" />
              <SimpleRow value={settings.outputValue} label="Output Value" />
              <SimpleRow value={abbreviateHash(settings.devAddress)} label="Dev Address" />
              <SimpleRow value={settings.devFee} label="Dev Fee" />

              {/* Fee Rate Selector */}
              <div className="flex flex-col space-y-2">
                <label className="text-black font-medium text-xl flex items-center gap-1">
                  Fee Rate (sat/vB)
                  <a
                    href="https://mempool.space"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700 underline cursor-pointer inline-flex items-center ml-4"
                  >
                    Check Fee Rates @ mempool.space
                  </a>
                </label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => setFeeRate(rate)}
                      className={`px-4 py-2 rounded ${
                        feeRate === rate
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-black hover:bg-gray-300'
                      }`}
                    >
                      {rate}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <Button variant="secondary" onClick={close} className="w-1/2">
                  Abort
                </Button>
                <Button
                  onClick={() => {
                    onLaunchJob({
                      ...settings,
                      feeRate: feeRate,
                    });
                  }}
                  className="w-1/2"
                >
                  Launch Job
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
