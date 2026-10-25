import { commerceService } from './commerceService';
export const orderView = row => ({ ...row, status: row.orderStatus === 'captured' ? 'paid' : 'pending', date: new Date(row.createdAt).toLocaleString(), productName: row.product.title, category: row.simulated ? 'SIMULATED TEST' : 'Test Mode', amount: row.amountMinor / 100, paymentMethod: 'Razorpay Test Mode', transactionId: row.capturedPaymentId || 'Not captured', items: [{ name: row.product.title, price: row.amountMinor / 100 }] });
export const orderService = {
  getOrders: async (query, signal) => (await commerceService.orders(query, signal)).data.map(orderView),
  createOrder: () => { throw new Error('Orders require backend-resolved product identifiers.'); },
  receipt: commerceService.receipt,
};
