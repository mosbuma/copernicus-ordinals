'use client';

import { useState, useEffect } from 'react';
import SphereInterface from '@/components/SphereInterface';
import UnisatProvider from '@/provider/UniSatProvider';
import { useUnisat } from '@/provider/UniSatProvider';
import { useEventEmitter } from '@/hooks/useEventEmitter';
import { NetworkType } from '@/types';
// import { ApiKeyDisplay } from "@/components/ApiKeyDisplay";
import { stringToBase64 } from '@/utils/utils';
import { api } from '@/utils/api';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import { OrderList } from '@/components/OrderList';
import { OrderDetail } from '@/components/OrderDetail';

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

export default function Home() {
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
  const [devFee, setDevFee] = useState(parseInt(process.env.NEXT_PUBLIC_DEV_FEE || '0'));
  const [devAddress, setDevAddress] = useState(process.env.NEXT_PUBLIC_DEV_ADDRESS || '');

  const [orderId, setOrderId] = useState<string | undefined>(undefined);

  const { network } = useUnisat();
  const newOrder$ = useEventEmitter<void>();

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

        console.debug('*** fetch template image');
        const response = await fetch(process.env.NEXT_PUBLIC_TEMPLATEFILE || '');
        const template = await response.text();

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
    // const isMainnet = network === NetworkType.livenet;

    // let tmpApiKey = undefined;
    // if(isMainnet) {
    //   tmpApiKey = process.env.NEXT_PUBLIC_UNISAT_API_KEY_MAINNET;
    // } else {
    //   tmpApiKey = process.env.NEXT_PUBLIC_UNISAT_API_KEY_TESTNET;
    // }

    // if(tmpApiKey) {
    //   setApiKey(tmpApiKey);
    // } else {
    //   console.error("No API key provided");
    //   return false;
    // }

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

    if (!process.env.NEXT_PUBLIC_DEV_FEE) {
      console.error('No dev fee provided');
      result = false;
    }

    if (!process.env.NEXT_PUBLIC_DEV_ADDRESS) {
      console.error('No dev address provided');
      result = false;
    }

    return result;
  };

  async function createOrder() {
    try {
      if (!receiveAddress || !outputValue || !feeRate || !fileList.length) {
        console.error('Missing required values');
        return;
      }

      setLoading(true);

      const orderData = {
        receiveAddress,
        feeRate,
        outputValue,
        files: fileList.map((item) => ({ dataURL: item.dataURL, filename: item.filename })),
        devAddress,
        devFee,
      };

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

  const currentFile = fileList.length > 0 ? fileList[0] : false;

  return (
    <UnisatProvider>
      <main className="min-h-screen p-8 bg-black">
        <div className="flex flex-col gap-4">
          <div className="flex flex-row gap-4">
            <div className="w-1/2">
              <SphereInterface
                address={trustedAddress}
                onCreateAddress={createAddress}
                onResetAddress={resetAddress}
                isMainnet={network === NetworkType.livenet}
              />
            </div>
            <div className="w-1/2 flex flex-col">
              <div className="flex flex-grow items-center justify-center">
                {currentFile && (
                  <div className="relative">
                    <Image src={currentFile.dataURL} alt="SVG" width={600} height={600} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Button
            onClick={createOrder}
            disabled={loading || !fileList.length}
            className={`px-4 py-2 ${loading ? 'bg-gray-500' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
          >
            {loading ? 'Creating Order...' : 'Create Order'}
          </Button>
          {orderId && (
            <div className="text-green-500">Order created successfully! ID: {orderId}</div>
          )}
        </div>
        {orderId && (
          <OrderDetail
            orderId={orderId}
            close={() => {
              setOrderId('');
            }}
          />
        )}
        <OrderList newOrder$={newOrder$} />
      </main>
    </UnisatProvider>
  );
}
