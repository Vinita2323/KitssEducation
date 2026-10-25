import { httpClient } from '../../../shared/api/httpClient';
import { authenticatedWrite } from './authService';
import { queryString } from './collegeService';
export const commerceService = {
  config: signal => httpClient.request('/public/payment-config', { signal }).then(r => r.data),
  create: (product, idempotencyKey) => authenticatedWrite('/orders', { product, idempotencyKey }),
  attempt: (id, idempotencyKey) => authenticatedWrite('/orders/' + id + '/payment-attempts', { idempotencyKey }),
  status: (id, signal) => httpClient.request('/orders/' + id + '/status', { signal }).then(r => r.data),
  verify: input => authenticatedWrite('/payments/razorpay/verify', input),
  orders: (query = {}, signal) => httpClient.request('/me/orders' + queryString(query), { signal }),
  receipt: id => httpClient.request('/me/orders/' + id + '/receipt').then(r => r.data),
  books: signal => httpClient.request('/me/books', { signal }).then(r => r.data),
};
