import { mockOrders } from "../data/mockOrders";

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export const orderService = {
  async getOrders() {
    await delay(350);
    return mockOrders;
  },

  async getOrderById(orderId) {
    await delay(200);
    const order = mockOrders.find((o) => o.id === orderId);
    if (!order) throw new Error("Order not found");
    return order;
  },

  async createOrder(orderData) {
    await delay(500);
    const newOrder = {
      id: `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      productName: orderData.productName || "Product",
      type: orderData.type || "Book",
      category: orderData.category || "Digital Books",
      date: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      amount: orderData.amount,
      originalAmount: orderData.originalAmount || orderData.amount,
      discountAmount: orderData.discountAmount || 0,
      paymentMethod: orderData.paymentMethod || "UPI (Google Pay)",
      transactionId: `TXN_${Date.now()}`,
      status: "Paid",
      invoiceUrl: "#",
      items: orderData.items || [{ name: orderData.productName, price: orderData.amount, qty: 1 }]
    };

    mockOrders.unshift(newOrder);
    return { success: true, order: newOrder };
  }
};
