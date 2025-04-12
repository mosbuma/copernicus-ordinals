export type CreateOrderFile = {
  filename: string;
  dataURL: string;
};

export type CreateOrderReq = {
  receiveAddress: string;
  feeRate: number;
  outputValue: number;
  files: CreateOrderFile[];
  devAddress: string;
  devFee: number;
};

export type ListOrderReq = {
  cursor: number;
  size: number;
  sort?: 'asc' | 'desc';
  status?: InscribeOrderStatus;
  receiveAddress?: string;
  clientId?: string;
};

export type ListOrderRes = {
  list: InscribeOrderData[];
  total: number;
};

export enum InscribeOrderStatus {
  // when create order
  pending = 'pending',
  // pay not enough, need pay more
  payment_notenough = 'payment_notenough',
  // pay over, need choose continue or refund
  payment_overpay = 'payment_overpay',
  // there is an inscription in payment transaction, need refund
  payment_withinscription = 'payment_withinscription',
  // in some case, payment transaction need be confirmed
  payment_waitconfirmed = 'payment_waitconfirmed',
  // payment success
  payment_success = 'payment_success',
  // ready to inscribe
  ready = 'ready',
  inscribing = 'inscribing',
  minted = 'minted',
  closed = 'closed',
  refunded = 'refunded',
  cancel = 'cancel',
}

export enum FileStatus {
  pending = 'pending',
  unconfirmed = 'unconfirmed',
  confirmed = 'confirmed',
}

export type InscribeOrderFileData = {
  filename: string;
  status: FileStatus;
  inscriptionId: string;
};

export type InscribeOrderData = {
  orderId: string;
  status: InscribeOrderStatus;
  payAddress: string;
  receiveAddress: string;
  amount: number; // need to pay amount
  paidAmount: number; // paid amount
  outputValue: number;
  feeRate: number;
  minerFee: number;
  serviceFee: number;
  files: InscribeOrderFileData[];
  count: number;
  pendingCount: number;
  unconfirmedCount: number;
  confirmedCount: number;
  createTime: number;
  devFee: number;
  refundAmount?: number;
  refundTxid?: string;
  refundFeeRate?: number;
};

export interface InscriptionUtxoData {
  id: string;
  number: number;
  address: string;
  genesis_address: string;
  genesis_block_height: number;
  genesis_block_hash: string;
  genesis_tx_id: string;
  genesis_fee: string;
  genesis_timestamp: number;
  tx_id: string;
  location: string;
  output: string;
  value: string;
  offset: string;
  sat_ordinal: string;
  sat_rarity: string;
  sat_coinbase_height: number;
  mime_type: string;
  content_type: string;
  content_length: number;
  timestamp: number;
  curse_type: string | null;
  recursive: boolean;
  recursion_refs: string[];
  parent: string | null;
  parent_refs: string[];
  delegate: string | null;
  metadata: any | null;
  meta_protocol: string | null;
  charms: string[];
}

export interface InscriptionsResponse {
  data: InscriptionUtxoData[];
  total: number;
  cursor: number;
}

export interface InscriptionsRequest {
  offset?: number;
  limit?: number;
}
