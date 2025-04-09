interface OrderFile {
  dataURL: string;
  filename: string;
}

interface CreateOrderParams {
  receiveAddress: string;
  feeRate: number;
  outputValue: number;
  files: OrderFile[];
  devAddress: string;
  devFee: number;
}

interface CreateOrderResponse {
  orderId: string;
}

export const api = {
  async createOrder(params: CreateOrderParams): Promise<CreateOrderResponse> {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error('Failed to create order');
    }

    return response.json();
  },
};
