import { mockSubscriptions } from "../data/mockSubscriptions";

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export const subscriptionService = {
  async getSubscriptions() {
    await delay(350);
    return mockSubscriptions;
  },

  async renewSubscription(subscriptionId) {
    await delay(500);
    const sub = mockSubscriptions.find((s) => s.id === subscriptionId);
    if (sub) {
      sub.status = "Active";
      sub.daysRemaining = 365;
      sub.expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    return { success: true, subscription: sub };
  }
};
