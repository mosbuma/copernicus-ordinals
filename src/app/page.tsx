'use client';

import { useState, useEffect, Suspense } from 'react';
import SphereInterface from '@/components/SphereInterface';
import UnisatProvider from '@/provider/UniSatProvider';
import { useUnisat } from '@/provider/UniSatProvider';
import { useEventEmitter } from '@/hooks/useEventEmitter';
import { NetworkType } from '@/types';
import { stringToBase64 } from '@/utils/utils';
import { api } from '@/utils/api';
import { OrderList } from '@/components/OrderList';
import { OrderDetail } from '@/components/OrderDetail';
import { CreateOrderReq } from '@/utils/api-types';
import { ConfirmInscribe } from '@/components/ConfirmInscribe';
import { NetworkStatus } from '@/components/NetworkStatus';
import { ShutdownButton } from '@/components/ShutdownButton';
import { useSearchParams, useRouter } from 'next/navigation';

const getApiUrl = (thenetwork: NetworkType, apipath: string) => {
  const url = `/api/${thenetwork === NetworkType.livenet ? NetworkType.livenet : NetworkType.testnet}${apipath}`;
  return url;
};

export type InscribeFileData = {
  filename: string;
  dataURL: string;
  size: number;
  type?: string;
};

function HomeContent() {
  const [trustedAddress, setTrustedAddress] = useState<string | undefined>(undefined);
  const [fileList, setFileList] = useState<InscribeFileData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // const [apiKey, setApiKey] = useState<string | undefined>(undefined);
  const nImages = parseInt(process.env.NEXT_PUBLIC_NIMAGES || '0');
  const [receiveAddress, setReceiveAddress] = useState(
    process.env.NEXT_PUBLIC_ORDINALS_WALLET_ADDRESS || ''
  );
  const [outputValue, setOutputValue] = useState(
    parseInt(process.env.NEXT_PUBLIC_OUTPUT_VALUE || '546')
  );
  const [feeRate, setFeeRate] = useState<number>(parseInt(process.env.NEXT_PUBLIC_FEE_RATE || '1'));

  const [orderId, setOrderId] = useState<string | undefined>(undefined);
  const [confirmInscribeData, setConfirmInscribeData] = useState<CreateOrderReq | undefined>(
    undefined
  );

  const { network } = useUnisat();
  const newOrder$ = useEventEmitter<void>();

  const searchParams = useSearchParams();
  const router = useRouter();

  // newOrder$.useSubscription(() => {
  //   console.log("New order event received");
  // });

  useEffect(() => {
    const loadSvgContent = async () => {
      try {
        const fillFileList = (svgTemplate: string) => {
          const fileList: InscribeFileData[] = [];
          for (let imageidx = 1; imageidx <= nImages; imageidx++) {
            const paddinglength = Math.ceil(Math.log10(nImages));
            const imgnumber = imageidx.toString().padStart(paddinglength, '0');
            const svg = svgTemplate
              .replace('#number#', imgnumber)
              .replace('#n#', nImages.toString());

            const svgAsDataUrl = `data:image/svg+xml;base64,${stringToBase64(svg)}`;

            fileList.push({
              filename: `c_${imgnumber}.svg`,
              dataURL: svgAsDataUrl,
              size: svg.length,
            });
          }
          setFileList(fileList);
        };

        if (!process.env.NEXT_PUBLIC_TEMPLATEFILE) {
          console.error('No template image provided');
          return;
        }

        const response = await fetch(process.env.NEXT_PUBLIC_TEMPLATEFILE || '');
        const template = await response.text();
        console.debug('*** fetch template image', template);

        fillFileList(template);
      } catch (error) {
        console.error('Error loading SVG content:', error);
      }
    };

    loadSvgContent();
  }, [nImages]);

  useEffect(() => {
    // Check for existing address on component mount
    fetch(getApiUrl(network, `/trustedaccount`))
      .then((res) => res.json())
      .then((data) => {
        if (data.address) {
          setTrustedAddress(data.address);
        }
      })
      .catch((error) => console.error('Error fetching address:', error));
  }, [network]);

  const checkProcessValues = (): boolean => {
    let result = true;
    if (!process.env.NEXT_PUBLIC_ORDINALS_WALLET_ADDRESS) {
      console.error('No ordinals wallet address provided');
      result = false;
    }

    if (!process.env.NEXT_PUBLIC_NIMAGES) {
      console.error('No number of images provided');
      result = false;
    }

    if (!process.env.NEXT_PUBLIC_OUTPUT_VALUE) {
      console.error('No output value provided');
      result = false;
    }

    if (!process.env.NEXT_PUBLIC_FEE_RATE) {
      console.error('No fee rate provided');
      result = false;
    }

    if (!process.env.NEXT_PUBLIC_COPERNICUS_FEE) {
      console.error('No dev fee provided');
      result = false;
    }

    return result;
  };

  function confirmInscribe() {
    if (!receiveAddress || !outputValue || !feeRate || !fileList.length || !trustedAddress) {
      console.error('Missing required values');
      return;
    }

    const orderData: CreateOrderReq = {
      receiveAddress,
      feeRate,
      outputValue,
      files: fileList.map((item) => ({ dataURL: item.dataURL, filename: item.filename })),
      devAddress: trustedAddress,
      devFee: 0,
    };

    setConfirmInscribeData(orderData);
  }

  async function createOrder(orderData: CreateOrderReq) {
    try {
      console.log('*** createOrder', orderData);

      setConfirmInscribeData(undefined);

      setLoading(true);
      const { orderId } = await api.createOrder(network, orderData);
      setOrderId(orderId);

      newOrder$.emit();
    } catch (e) {
      console.error('*** createOrder error', e);
    } finally {
      setLoading(false);
    }
  }

  const createAddress = async () => {
    try {
      const response = await fetch(getApiUrl(network, `/trustedaccount`), {
        method: 'POST',
      });
      const data = await response.json();
      if (data.address) {
        setTrustedAddress(data.address);
      } else {
        console.error('Failed to create address');
      }
    } catch (error) {
      console.error('Error creating address:', error);
    }
  };

  const resetAddress = async () => {
    try {
      await fetch(getApiUrl(network, `/trustedaccount`), {
        method: 'DELETE',
      });
      setTrustedAddress(undefined);
      window.location.href = '/';
    } catch (error) {
      console.error('Error resetting address:', error);
    }
  };

  if (false === checkProcessValues()) {
    return (
      <main className="min-h-screen p-8 bg-black">
        <div className="text-white">Missing required values</div>
      </main>
    );
  }

  const showResetAddress = searchParams?.get('RESET') !== null;

  return (
    <UnisatProvider>
      <main className="min-h-screen bg-gray-900 w-screen flex justify-center">
        <div className="flex flex-col bg-black w-2/3 h-full justify-start items-center">
          <SphereInterface
            address={trustedAddress}
            recipientAddress={receiveAddress}
            onCreateAddress={createAddress}
            onResetAddress={resetAddress}
            onInscribe={confirmInscribe}
            isMainnet={network === NetworkType.livenet}
            showResetAddress={showResetAddress}
          />
          {<OrderList newOrder$={newOrder$} setOrderId={setOrderId} />}
          {orderId && (
            <OrderDetail
              orderId={orderId}
              close={() => {
                setOrderId('');
              }}
            />
          )}
          {confirmInscribeData && (
            <ConfirmInscribe
              settings={confirmInscribeData}
              close={() => setConfirmInscribeData(undefined)}
              onLaunchJob={createOrder}
            />
          )}
        </div>
        <NetworkStatus />
        <ShutdownButton />
      </main>
    </UnisatProvider>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
