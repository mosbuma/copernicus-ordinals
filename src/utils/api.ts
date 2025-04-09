import { NetworkType } from '@/types';
import { CreateOrderReq, InscribeOrderData, ListOrderReq, ListOrderRes } from './api-types';
import { get, post } from './httpUtils';

export const api = {
  createOrder(network: NetworkType, req: CreateOrderReq): Promise<InscribeOrderData> {
    return post(network, '/v2/inscribe/order/create', req);
  },
  listOrder(network: NetworkType, req: ListOrderReq): Promise<ListOrderRes> {
    console.debug('**** listOrder ****', req);
    return get(network, '/v2/inscribe/order/list', req);
  },
  orderInfo(network: NetworkType, orderId: string): Promise<InscribeOrderData> {
    return get(network, `/v2/inscribe/order/${orderId}`);
  },
};
