// tslint:disable:variable-name

import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';
import * as querystring from 'querystring';

export function AuthenticatedClient(
  key: string,
  secret: string,
  passphrase: string,
  apiUri = 'https://www.okex.com',
  axiosConfig = {}
): any {
  const axiosInstance: AxiosInstance = axios.create({
    baseURL: apiUri,
    timeout: 3000,
    ...axiosConfig
  });

  const signRequest = (
    method: string,
    path: string,
    options: { readonly qs?: string; readonly body?: string } = {}
  ) => {
    // tslint:disable:no-if-statement
    // tslint:disable:no-let
    // tslint:disable:no-expression-statement
    const timestamp = Date.now() / 1000;
    const what = timestamp + method.toUpperCase() + path + (options.body || '');
    const hmac = crypto.createHmac('sha256', secret);
    const signature = hmac.update(what).digest('base64');
    return {
      key,
      passphrase,
      signature,
      timestamp
    };
  };
  const getSignature = (
    method: string,
    relativeURI: string,
    opts: { readonly body?: string } = {}
  ) => {
    const sig = signRequest(method, relativeURI, opts);

    return {
      'OK-ACCESS-KEY': sig.key,
      'OK-ACCESS-PASSPHRASE': sig.passphrase,
      'OK-ACCESS-SIGN': sig.signature,
      'OK-ACCESS-TIMESTAMP': sig.timestamp
    };
  };

  async function get(url: string, params?: object): Promise<any> {
    return axiosInstance
      .get(url, { params, headers: { ...getSignature('get', url) } })
      .then(res => res.data);
  }

  async function post(
    url: string,
    body?: object,
    params?: object
  ): Promise<any> {
    const bodyJson = JSON.stringify(body);
    return axiosInstance
      .post(url, body, {
        headers: { ...getSignature('post', url, { body: bodyJson }) },
        params
      })
      .then(res => res.data);
  }

  return {
    spot(): any {
      return {
        async getAccounts(currency?: string): Promise<any> {
          return currency
            ? get(`/api/spot/v3/accounts/${currency}`)
            : get('/api/spot/v3/accounts');
        },
        async getLedger(currency: string): Promise<any> {
          return get(`/api/spot/v3/accounts/${currency}/ledger`);
        },
        async postOrder(params: {
          readonly instrument_id: string;
          readonly client_oid?: string;
          readonly type: string;
          readonly side: string;
          readonly margin_trading?: number;
        }): Promise<any> {
          return post('/api/spot/v3/orders', params);
        },
        async postBatchOrders(
          params: [
            {
              readonly instrument_id: string;
              readonly client_oid?: string;
              readonly type: string;
              readonly side: string;
              readonly margin_trading?: number;
            }
          ]
        ): Promise<any> {
          return post('/api/spot/v3/batch_orders', params);
        },
        async postCancelOrder(
          order_id: string,
          params: {
            readonly instrument_d: string;
            readonly client_oid?: string;
          }
        ): Promise<any> {
          return post(`/api/spot/v3/cancel_orders/${order_id}`, params);
        },
        async postCancelBatchOrders(
          params: [
            { readonly instument_id: string; readonly order_ids: [string] }
          ]
        ): Promise<any> {
          return post(`/api/spot/v3/cancel_batch_orders`, params);
        },
        async getOrders(params: {
          readonly status: string;
          readonly instument_id: string;
          readonly from?: string;
          readonly to?: string;
          readonly limit?: string;
        }): Promise<any> {
          return get(`/api/spot/v3/orders?` + querystring.stringify(params));
        },
        async getOrdersPending(params?: {
          readonly from?: string;
          readonly to?: string;
          readonly limit?: string;
          readonly instrument_id?: string;
        }): Promise<any> {
          return get(
            `/api/spot/v3/orders_pending` + params
              ? `?${querystring.stringify(params)}`
              : ''
          );
        },
        async getOrder(
          order_id: string,
          params: { readonly instrument_id: string }
        ): Promise<any> {
          return get(
            `/api/spot/v3/orders/${order_id}?` + querystring.stringify(params)
          );
        },
        async getFills(params: {
          readonly order_id: string;
          readonly instument_id: string;
          readonly from?: string;
          readonly to?: string;
          readonly limit?: string;
        }): Promise<any> {
          return get(`/api/spot/v3/fills?${querystring.stringify(params)}`);
        }
      };
    },
    account(): any {
      return {
        async getWallet(currency?: string): Promise<any> {
          return get(`/api/account/v3/wallet${currency ? `/${currency}` : ''}`);
        },
        async postTransfer(params: {
          readonly currency: string;
          readonly amount: number;
          readonly from: number;
          readonly to: number;
          readonly sub_account?: string;
          readonly instument_id?: string;
        }): Promise<any> {
          return post('/api/account/v3/transfer', params);
        },
        async postWithdrawal(params: {
          readonly currency: string;
          readonly amount: string;
          readonly destination: number;
          readonly to_address: string;
          readonly trade_pwd: string;
          readonly fee: number;
        }): Promise<any> {
          return post('/api/account/v3/withdrawal', params);
        },
        async getWithdrawalHistory(currency?: string): Promise<any> {
          return get(
            `/api/account/v3/withdrawal/history${
              currency ? `/${currency}` : ''
            }`
          );
        },
        async getLedger(params?: {
          readonly currency?: string;
          readonly type?: number;
          readonly from?: number;
          readonly to?: number;
          readonly limit?: number;
        }): Promise<any> {
          return get(
            `/api/account/v3/ledger${
              params ? `?${querystring.stringify(params)}` : ''
            }`
          );
        },
        async getAddress(params: { readonly currency: string }): Promise<any> {
          return get(
            `/api/account/v3/deposit/address?${querystring.stringify(params)}`
          );
        },
        async getDepositHistory(currency?: string): Promise<any> {
          return get(
            `/api/account/v3/deposit/history${currency ? `/${currency}` : ''}`
          );
        }
      };
    },
    futures(): any {
      return {
        async getPosition(instrument_id?: string): Promise<any> {
          return get(
            `/api/futures/v3${
              instrument_id ? `/${instrument_id}` : ''
            }/position`
          );
        },
        async getAccounts(currency?: string): Promise<any> {
          return get(
            `/api/futures/v3/accounts${currency ? `/${currency}` : ''}`
          );
        },
        async getLeverage(currency: string): Promise<any> {
          return get(`/api/futures/v3/accounts/${currency}/leverage`);
        },
        async postLeverage(currency: string, params: object): Promise<any> {
          return post(`/api/futures/v3/accounts/${currency}/leverage`, params);
        },
        async getAccountsLedger(
          currency: string,
          params?: {
            readonly from?: number;
            readonly to?: number;
            readonly limit?: number;
          }
        ): Promise<any> {
          return get(
            `/api/futures/v3/accounts/${currency}/ledger${
              params ? `?${querystring.stringify(params)}` : ''
            }`
          );
        },
        async postOrder(params: {
          readonly client_oid?: string;
          readonly instrument_id: string;
          readonly type: string;
          readonly price: number;
          readonly size: number;
          readonly match_price?: string;
          readonly leverage: number;
        }): Promise<any> {
          return post('/api/futures/v3/order', params);
        },
        async postOrders(params: {
          readonly instrument_id: string;
          readonly orders_data: string;
          readonly leverage: number;
          readonly client_oid?: string;
        }): Promise<any> {
          return post('/api/futures/v3/orders', params);
        },
        async cancelOrder(
          instrument_id: string,
          order_id: string
        ): Promise<any> {
          return post(
            `/api/futures/v3/cancel_order/${instrument_id}/${order_id}`
          );
        },
        async cancelBatchOrders(
          instrument_id: string,
          params: {
            readonly order_ids: [number];
          }
        ): Promise<any> {
          return post(
            `/api/futures/v3/cancel_batch_orders/${instrument_id}`,
            params
          );
        },
        async getOrders(
          instrument_id: string,
          params: {
            readonly status: number;
            readonly from?: number;
            readonly to?: number;
            readonly limit?: number;
          }
        ): Promise<any> {
          return get(
            `/api/futures/v3/orders/${instrument_id}?${querystring.stringify(
              params
            )}`
          );
        },
        async getOrder(instrument_id: string, order_id: string): Promise<any> {
          return get(`/api/futures/v3/orders/${instrument_id}/${order_id}`);
        },
        async getFills(params: {
          readonly order_id: string;
          readonly instrument_id: string;
          readonly from?: number;
          readonly to?: number;
          readonly limit?: number;
        }): Promise<any> {
          return get(`/api/futures/v3/fills?${querystring.stringify(params)}`);
        }
      };
    }
  };
}
