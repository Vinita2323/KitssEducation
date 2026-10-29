import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { coachingService } from '../../services/coachingService';
import { commerceService } from '../../services/commerceService';
import { openRazorpayCheckout } from '../../services/razorpayService';
export function VerifiedCoursePurchase({ course, onRefresh }) {
  const { user } = useAuth(); const [params, setParams] = useSearchParams();
  const [message, setMessage] = useState(''), [busy, setBusy] = useState(false), [available, setAvailable] = useState(false), [state, setState] = useState(null);
  const context = `${user?.id}:${course.id}`;
  const [invalidOrder, setInvalidOrder] = useState(false);
  const creation = useRef(crypto.randomUUID()), attempt = useRef(crypto.randomUUID()), identity = useRef(context); identity.current = context;
  const matchesCourse = row => row.product?.kind === 'course_plan' && (row.product.courseId ? row.product.courseId === course.id : course.subscriptionPlans?.some(plan => plan.id === row.product.id));
  useEffect(() => { setState(null); setInvalidOrder(false); setBusy(false); setMessage(''); creation.current = crypto.randomUUID(); attempt.current = crypto.randomUUID(); }, [user?.id, course.id]);
  useEffect(() => { const c = new AbortController(); commerceService.config(c.signal).then(v => { if (!c.signal.aborted) setAvailable(v.available); }).catch(() => {}); return () => c.abort(); }, [user?.id, course.id]);
  const orderId = params.get('order');
  useEffect(() => { setState(null); setInvalidOrder(false); if (!orderId || !user) return; const c = new AbortController(); let count = 0; const refresh = async () => { try { const row = await commerceService.status(orderId, c.signal); if (c.signal.aborted) return; if (!matchesCourse(row)) { setState(null); setInvalidOrder(true); setMessage('This order does not belong to this course. Open the correct purchase from order history.'); return; } setState(row); if (row.orderStatus === 'captured' && row.activationStatus === 'applied') { setMessage('Payment confirmed and course access is ready. Refresh the course to open lessons.'); } } catch (e) { if (!c.signal.aborted) setMessage(e.message); } }; refresh(); const timer = setInterval(() => { if (++count < 40) refresh(); }, 3000); return () => { c.abort(); clearInterval(timer); }; }, [orderId, user?.id, course.id]);
  const pay = async plan => { if (invalidOrder || (orderId && state?.id !== orderId)) return; const owner = context; setBusy(true); setMessage(''); try { const order = state ?? await commerceService.create({ kind: 'course_plan', id: plan.id }, creation.current); if (identity.current !== owner) return; if (!matchesCourse(order) || order.product.id !== plan.id) { setInvalidOrder(true); setMessage('This order does not belong to the selected course plan. Open the correct purchase from order history.'); return; } setState(order); const next = new URLSearchParams(params); next.set('order', order.id); setParams(next, { replace: true }); await openRazorpayCheckout({ orderId: order.id, attemptKey: order.attemptId || attempt.current, onSuccess: row => { if (identity.current !== owner) return; setState(row); setMessage(row.orderStatus === 'captured' ? 'Payment confirmed. Your access is being updated.' : 'Payment remains pending. No access granted.'); }, onDismiss: () => { if (identity.current === owner) setMessage('Checkout closed. Check your order for the latest payment status.'); }, onFailure: e => { if (identity.current === owner) setMessage(e.message); } }); } catch (e) { if (identity.current === owner) setMessage(e.message); } finally { if (identity.current === owner) setBusy(false); } };
  const free = async () => { setBusy(true); try { await coachingService.joinCourse(course.id); onRefresh?.(); setMessage('Your free course access is ready.'); } catch (e) { setMessage(e.message); } finally { setBusy(false); } };
  if (!user) return <Link className="underline" to="/login">Sign in to access or purchase this course</Link>;
  const blocked = plan => busy || !available || invalidOrder || (orderId && state?.id !== orderId) || (state && state.product.id !== plan.id) || course.enrollment?.state === 'revoked';
  const term = plan => plan.durationMonths ? plan.durationMonths + ' calendar months' : plan.durationDays + ' days';
  // Enrolled students may renew early with a paid plan: the new period starts when the current one ends.
  const renewing = course.isEnrolled, plans = (course.subscriptionPlans ?? []).filter(plan => !renewing || plan.priceMinor > 0);
  const until = course.enrollment?.expiresAt ? new Date(course.enrollment.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
  return <section aria-label="Course access and purchase" className="p-4 border rounded-2xl space-y-3 text-sm bg-white">
    <h2 className="font-bold">Course access</h2>
    <p>{course.enrollment?.state === 'expired' ? 'Access expired. A new verified purchase is required for a new paid period.' : course.isEnrolled ? 'Your course access is active.' : 'Choose an approved plan.'}{course.isEnrolled && until && <> Access lasts until <strong>{until}</strong>.</>}</p>
    {renewing && plans.length > 0 && <p className="text-[#53647c]">Renew early to keep learning without a break. The new period starts when your current access ends.</p>}
    <div className="grid gap-2">{plans.map(plan => <div key={plan.id} className={'rounded-xl border p-3 space-y-2 ' + ((plan.isPopular || plan.popular) ? 'border-[#FF8A00]' : 'border-[#E6E8EC]')}>
      <div className="flex flex-wrap items-baseline justify-between gap-2"><span className="font-bold">{plan.name}{(plan.isPopular || plan.popular) && <span className="ml-2 text-xs font-bold text-[#FF8A00]">POPULAR</span>}</span><span className="font-extrabold">{plan.priceMinor === 0 ? 'Free' : '₹' + (plan.priceMinor / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}<span className="font-normal text-[#53647c]"> / {term(plan)}</span></span></div>
      {plan.features?.length > 0 && <ul className="list-disc pl-5 text-[#53647c]">{plan.features.map((feature, index) => <li key={index}>{feature}</li>)}</ul>}
      {plan.priceMinor === 0 ? <button className="w-full p-2.5 rounded-lg bg-[#0A1D3F] text-white font-semibold disabled:opacity-50" disabled={busy} onClick={free}>Open free course — {plan.name}</button>
        : <button className="w-full p-2.5 rounded-lg bg-[#FF8A00] text-white font-semibold disabled:opacity-50" disabled={blocked(plan)} onClick={() => pay(plan)}>{state ? 'Resume ' + state.product.title : (renewing ? 'Renew with ' : 'Purchase ') + plan.name} — INR {((state?.amountMinor ?? plan.priceMinor) / 100).toFixed(2)} {state ? '(saved order)' : '/ ' + term(plan)}</button>}
    </div>)}</div>
    {!available && plans.some(plan => plan.priceMinor > 0) && <p>Paid checkout is currently unavailable. Eligible free courses remain available.</p>}{state && <p>Order {state.reference}: {state.paymentStatus}; access {state.activationStatus}</p>}{message && <p role="status">{message}</p>}<button className="p-2 underline" onClick={onRefresh}>Refresh course access</button></section>;
}
