import axios from 'axios';
import { NetworkType } from '../types';

// let apiKey = localStorage.getItem('apiKey') || '';
// let network = NetworkType.livenet;

// export function setApiNetwork(type: NetworkType) {
//     network = type;
// }

// export function setApiKey(key: string) {
//     apiKey = key;
// }

function createApi(network: NetworkType) {
  try {
    const baseURL =
      network === NetworkType.livenet
        ? 'https://open-api.unisat.io'
        : 'https://open-api-testnet.unisat.io';
    const apiKey =
      network === NetworkType.livenet
        ? process.env.NEXT_PUBLIC_UNISAT_API_KEY_MAINNET
        : process.env.NEXT_PUBLIC_UNISAT_API_KEY_TESTNET;

    const api = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    api.interceptors.request.use((config) => {
      if (!apiKey) {
        throw new Error('input apiKey and reload page');
      }
      config.headers.Authorization = `Bearer ${apiKey}`;
      return config;
    });

    return api;
  } catch (error) {
    console.error('**** createApi ERROR ****', error);
    throw error;
  }
}

export const get = async (network: NetworkType, url: string, params?: any) => {
  try {
    const res = await createApi(network).get(url, { params });
    if (res.status !== 200) {
      throw new Error(res.statusText);
    }

    const responseData = res.data;

    if (responseData.code !== 0) {
      console.error('**** get failed with error ****', res);
      throw new Error(responseData.msg);
    }
    return responseData.data;
  } catch (error) {
    console.error('**** get crashed with error ****', error);
    throw error;
  }
};

export const post = async (network: NetworkType, url: string, data?: any) => {
  const res = await createApi(network).post(url, data);
  if (res.status !== 200) {
    throw new Error(res.statusText);
  }

  const responseData = res.data;

  if (responseData.code !== 0) {
    throw new Error(responseData.msg);
  }

  return responseData.data;
};
