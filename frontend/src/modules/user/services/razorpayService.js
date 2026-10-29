export const RAZORPAY_CONFIG = Object.freeze({ merchantName: 'KITSS Education', themeColor: '#FF8A00', logo: '/KitssLogo.png' });
import { commerceService } from './commerceService';
let scriptPromise;
export function loadRazorpayScript() {
  scriptPromise ??= new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const script = document.createElement('script'); script.src = 'https://checkout.razorpay.com/v1/checkout.js'; script.async = true;
    const timer = setTimeout(() => { script.remove(); reject(new Error('Checkout loading timed out')); }, 15000);
    script.onload = () => { clearTimeout(timer); resolve(); }; script.onerror = () => { clearTimeout(timer); script.remove(); reject(new Error('Checkout unavailable')); };
    document.body.appendChild(script);
  }).catch(error => { scriptPromise = null; throw error; });
  return scriptPromise;
}
// Client-priced legacy callers cannot launch Checkout or grant access.
export async function openRazorpayCheckout({ orderId, attemptKey, onSuccess, onFailure, onDismiss } = {}) {
  if (!orderId || !attemptKey) throw new Error('Checkout is not ready. Open the book or course page and try again, or contact support.');
  const result = await commerceService.attempt(orderId, attemptKey), checkout = result.checkout;
  if (!checkout) return result;
  if (checkout.paymentMode !== 'test' || checkout.simulated || !/^rzp_test_[A-Za-z0-9]+$/.test(checkout.keyId)) throw new Error('Approved Razorpay Test Mode checkout is unavailable');
  await loadRazorpayScript();
  const instance = new window.Razorpay({ key: checkout.keyId, order_id: checkout.providerOrderId, amount: checkout.amountMinor, currency: checkout.currency, name: 'KITSS Education', image: '/KitssLogo.png', theme: { color: '#FF8A00' },
    handler: async response => {
      try { const state = await commerceService.verify({ orderId, attemptId: checkout.attemptId, razorpay_order_id: response.razorpay_order_id, razorpay_payment_id: response.razorpay_payment_id, razorpay_signature: response.razorpay_signature }); onSuccess?.(state); }
      catch (error) { onFailure?.(error); }
    }, modal: { ondismiss: () => onDismiss?.(), backdropclose: false },
  });
  instance.on('payment.failed', () => onFailure?.(new Error('Payment attempt failed. Check authoritative order status before retrying.')));
  instance.open(); return result;
}
