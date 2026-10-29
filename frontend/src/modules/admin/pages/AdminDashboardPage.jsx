import React, { useCallback, useEffect, useId, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowRight, BookOpen, Building2, CheckCircle2, ClipboardList, GraduationCap, IndianRupee, RefreshCw, ShoppingBag, School, UserCog, Users } from 'lucide-react';
import { httpClient } from '../../../shared/api/httpClient';
import { useAuth } from '../../user/context/AuthContext';
import { AdminField, AdminInput } from '../components/AdminFields';

// Calendar days are Indian Standard Time, matching the API (fixed UTC+05:30, no DST).
const istDay = (offsetDays = 0) => new Date(Date.now() + 330 * 60000 + offsetDays * 86400000).toISOString().slice(0, 10);
const presets = [
  ['today', 'Today', () => ({ from: istDay(), to: istDay() })],
  ['7d', '7 days', () => ({ from: istDay(-6), to: istDay() })],
  ['30d', '30 days', () => ({ from: istDay(-29), to: istDay() })],
  ['month', 'This month', () => ({ from: istDay().slice(0, 8) + '01', to: istDay() })],
  ['all', 'All time', () => ({})]
];
const rupees = (minor = 0) => { const digits = minor % 100 ? 2 : 0; return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: digits, maximumFractionDigits: digits }).format(minor / 100); };
const shortDate = value => new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });
const longDate = value => new Date(value + 'T00:00:00Z').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const productLabels = { book: 'Digital books', course_plan: 'Coaching courses', registration_fee: 'Registration fees', franchise_joining: 'Franchise joining fees', franchise_renewal: 'Franchise renewals' };
const orderStatus = { paid: ['Paid', 'bg-emerald-50 text-emerald-800 ring-emerald-200'], failed: ['Payment failed', 'bg-rose-50 text-rose-800 ring-rose-200'], unpaid: ['Not paid', 'bg-slate-100 text-slate-700 ring-slate-200'] };

function periodFrom(params) {
  const range = params.get('range') || (params.get('from') || params.get('to') ? 'custom' : '30d');
  if (range === 'custom') return { range, from: params.get('from') || '', to: params.get('to') || '' };
  const preset = presets.find(p => p[0] === range) ?? presets[2];
  return { range: preset[0], ...preset[2]() };
}
function periodLabel({ range, from, to }) {
  if (range !== 'custom') return { today: 'today', '7d': 'the last 7 days', '30d': 'the last 30 days', month: 'this month', all: 'all time' }[range];
  if (from && to) return from === to ? longDate(from) : longDate(from) + ' – ' + longDate(to);
  return from ? 'since ' + longDate(from) : 'until ' + longDate(to);
}

function StatCard({ icon: Icon, label, value, detail, tone }) {
  return <article className="bg-white border rounded-2xl p-5 flex flex-col gap-3 min-w-0">
    <div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-[#53647c]">{label}</p><span className={'grid place-items-center w-9 h-9 rounded-xl shrink-0 ' + tone}><Icon aria-hidden="true" size={18} /></span></div>
    <div className="text-[1.75rem] leading-none font-extrabold tracking-tight text-[#0A1D3F] break-words">{value}</div>
    {detail && <p className="text-sm">{detail}</p>}
  </article>;
}
function Panel({ title, action, className = '', children }) {
  return <section className={'bg-white border rounded-2xl p-5 min-w-0 ' + className} aria-label={title}>
    <div className="flex items-center justify-between gap-3 mb-4"><h2 className="text-base font-bold text-[#0A1D3F]">{title}</h2>{action}</div>
    {children}
  </section>;
}
function Skeleton() {
  return <div aria-hidden="true" className="space-y-5 animate-pulse">
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">{[0, 1, 2, 3].map(i => <div key={i} className="h-36 rounded-2xl bg-white border" />)}</div>
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-4"><div className="h-64 rounded-2xl bg-white border xl:col-span-2" /><div className="h-64 rounded-2xl bg-white border xl:col-span-3" /></div>
  </div>;
}

export const AdminDashboardPage = () => {
  const { user, can } = useAuth(), id = useId();
  const [params, setParams] = useSearchParams();
  const period = periodFrom(params), query = new URLSearchParams(Object.entries({ from: period.from, to: period.to }).filter(([, v]) => v)).toString();
  const [custom, setCustom] = useState({ from: period.from, to: period.to }), [customOpen, setCustomOpen] = useState(period.range === 'custom');
  const [data, setData] = useState(null), [error, setError] = useState(''), [formError, setFormError] = useState(''), [version, setVersion] = useState(0), [loading, setLoading] = useState(true);

  useEffect(() => {
    const c = new AbortController(); setError(''); setLoading(true);
    httpClient.request('/admin/dashboard' + (query ? '?' + query : ''), { signal: c.signal }).then(r => { if (!c.signal.aborted) setData(r.data); }).catch(e => { if (!c.signal.aborted) setError(e.message); }).finally(() => { if (!c.signal.aborted) setLoading(false); });
    return () => c.abort();
  }, [query, version]);
  useEffect(() => { if (period.range === 'custom') setCustom({ from: period.from, to: period.to }); }, [period.range, period.from, period.to]);

  const choose = range => { setFormError(''); setCustomOpen(range === 'custom'); if (range !== 'custom') setParams(range === '30d' ? {} : { range }); };
  const applyCustom = e => {
    e.preventDefault();
    if (!custom.from && !custom.to) { setFormError('Choose a start date, an end date, or both.'); return; }
    if (custom.from && custom.to && custom.from > custom.to) { setFormError('Start date must not follow end date.'); return; }
    setFormError(''); setParams({ range: 'custom', ...Object.fromEntries(Object.entries(custom).filter(([, v]) => v)) });
  };
  const refresh = useCallback(() => setVersion(v => v + 1), []);

  const payments = data?.payments, overview = data?.overview, label = periodLabel(period);
  const review = overview?.awaitingReview ?? {};
  const attention = [
    [review.admissions, 'admission application', 'awaiting review', '/admin/applications', 'admissions.read'],
    [review.franchises, 'franchise application', 'awaiting review', '/admin/franchise-requests', 'franchises.read'],
    [review.registrations, 'registration', 'to verify', '/admin/registrations', 'registrations.read'],
    [review.accessRequests, 'access request', 'pending', '/admin/access-requests', 'access.read'],
    [payments?.needsAction, 'paid order', 'needs staff action', '/admin/orders', 'commerce.read'],
    [payments?.pendingRefunds, 'refund request', 'pending', '/admin/refunds', 'refunds.read']
  ].filter(([n]) => n > 0);
  const pending = attention.reduce((n, [count]) => n + count, 0);
  const firstName = (user?.name || '').trim().split(/\s+/)[0];

  return <div className="space-y-6 text-[#0A1D3F]" aria-busy={loading}>
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1>{firstName ? 'Welcome back, ' + firstName : 'Dashboard'}</h1>
        <p className="text-sm mt-1">Your platform at a glance for <strong className="text-[#0A1D3F]">{label}</strong>. Days follow Indian time (IST).</p>
      </div>
      {payments?.environment?.mode === 'test' && <p className="inline-flex items-center gap-2 rounded-full bg-amber-50 text-amber-900 ring-1 ring-amber-200 px-3 py-1.5 text-sm font-semibold">
        <AlertTriangle aria-hidden="true" size={15} />{payments.environment.simulated ? 'Simulated payments' : 'Payment test keys'}: no real money is collected
      </p>}
    </header>

    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Reporting period">
      {[...presets.map(([key, text]) => [key, text]), ['custom', 'Custom']].map(([key, text]) => {
        const active = (customOpen ? 'custom' : period.range) === key;
        return <button key={key} type="button" aria-pressed={active} onClick={() => choose(key)}
          className={'rounded-full px-4 py-2 text-sm font-semibold border transition-colors ' + (active ? 'bg-[#0A1D3F] text-white border-[#0A1D3F]' : 'bg-white text-[#0A1D3F] border-[#cbd6e5] hover:bg-[#edf3fa]')}>{text}</button>;
      })}
      <button type="button" onClick={refresh} className="ml-auto inline-flex items-center gap-2 text-sm"><RefreshCw aria-hidden="true" size={15} />Refresh</button>
    </div>

    {customOpen && <form onSubmit={applyCustom} aria-label="Custom reporting period" className="bg-white border rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
      {['from', 'to'].map(k => <AdminField key={k} help="">{k === 'from' ? 'Start date' : 'End date'}<AdminInput aria-label={k === 'from' ? 'Start date' : 'End date'} type="date" min="1970-01-01" max="9998-12-31" value={custom[k]} onChange={e => setCustom(d => ({ ...d, [k]: e.target.value }))} aria-invalid={Boolean(formError)} aria-describedby={formError ? id + '-error' : undefined} /></AdminField>)}
      <button className="bg-[#0A1D3F] text-white px-5 py-2.5 font-semibold">Apply dates</button>
      {formError && <p id={id + '-error'} role="alert" className="sm:col-span-3">{formError}</p>}
    </form>}

    {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3"><span>{error}</span><button type="button" onClick={refresh}>Try again</button></div>}
    {!data && !error && <><p role="status" className="sr-only">Loading dashboard…</p><Skeleton /></>}

    {data && <div className={'space-y-6 transition-opacity ' + (loading ? 'opacity-60' : '')}>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={IndianRupee} tone="bg-emerald-50 text-emerald-700" label="Money collected" value={rupees(payments.collected.amountMinor)}
          detail={payments.collected.orders ? 'From ' + payments.collected.orders + ' paid order' + (payments.collected.orders === 1 ? '' : 's') : 'No paid orders in this period'} />
        <StatCard icon={ShoppingBag} tone="bg-sky-50 text-sky-700" label="Paying students" value={payments.collected.buyers}
          detail={payments.failedPayments ? payments.failedPayments + ' failed payment' + (payments.failedPayments === 1 ? '' : 's') + ' · ' + payments.unpaidCheckouts + ' not completed' : payments.unpaidCheckouts + ' checkout' + (payments.unpaidCheckouts === 1 ? '' : 's') + ' not completed'} />
        {overview && <StatCard icon={Users} tone="bg-violet-50 text-violet-700" label="Active students" value={overview.people.students}
          detail={period.range === 'all' ? overview.people.newStudents + ' signed up in total' : '+' + overview.people.newStudents + ' new ' + (period.range === 'custom' ? 'in this period' : ['today', 'month'].includes(period.range) ? label : 'in ' + label)} />}
        <StatCard icon={ClipboardList} tone={pending ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'} label="Waiting on your team" value={pending}
          detail={pending ? 'Reviews and follow-ups below' : 'Nothing pending'} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <div className="xl:col-span-2 space-y-4 min-w-0">
          <Panel title="Needs attention">
            {attention.length ? <ul className="divide-y divide-[#edf1f7]">{attention.map(([count, noun, state, to, permission]) => {
              const text = <><span className="grid place-items-center min-w-9 h-9 px-2 rounded-xl bg-amber-50 text-amber-800 font-bold text-sm">{count}</span><span className="flex-1 text-sm">{noun + (count === 1 ? '' : 's')} {state}</span></>;
              return <li key={to}>{can(permission)
                ? <Link to={to} className="flex items-center gap-3 py-3 rounded-lg hover:bg-[#f8faff] -mx-2 px-2">{text}<ArrowRight aria-hidden="true" size={16} className="text-[#53647c]" /></Link>
                : <div className="flex items-center gap-3 py-3">{text}</div>}</li>;
            })}</ul>
              : <p className="flex items-center gap-3 text-sm"><CheckCircle2 aria-hidden="true" size={20} className="text-emerald-600 shrink-0" />All caught up. No applications, requests or orders are waiting for review.</p>}
          </Panel>
          <Panel title="Revenue by product">
            {payments.byProduct.length ? <ul className="space-y-3">{payments.byProduct.map(row => <li key={row.kind} className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0">{productLabels[row.kind] ?? row.kind}<span className="text-[#53647c]"> · {row.orders} order{row.orders === 1 ? '' : 's'}</span></span>
              <span className="font-bold tabular-nums whitespace-nowrap">{rupees(row.amountMinor)}{payments.collected.amountMinor > 0 && <span className="font-normal text-[#53647c]"> · {Math.round(row.amountMinor * 100 / payments.collected.amountMinor)}%</span>}</span>
            </li>)}</ul> : <p className="text-sm">No payments received {period.range === 'all' ? 'yet' : 'in this period'}.</p>}
          </Panel>
        </div>

        <Panel title="Recent orders" className="xl:col-span-3" action={can('commerce.read') && <Link to="/admin/orders" className="text-sm font-semibold inline-flex items-center gap-1">View all<ArrowRight aria-hidden="true" size={14} /></Link>}>
          {payments.recentOrders.length ? <ul className="divide-y divide-[#edf1f7]">{payments.recentOrders.map(o => {
            const [text, tone] = orderStatus[o.status];
            return <li key={o.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
              <div className="flex-1 min-w-[12rem]"><p className="font-semibold text-sm break-words">{o.title}</p><p className="text-sm">{(o.studentName || 'Student') + ' · ' + shortDate(o.createdAt)}</p></div>
              <span className="font-bold tabular-nums text-sm">{rupees(o.amountMinor)}</span>
              <span className={'rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ' + tone}>{text}</span>
            </li>;
          })}</ul> : <p className="text-sm">No orders yet. They will appear here once students start checking out.</p>}
        </Panel>
      </div>

      {overview && <section aria-label="Catalogue and people">
        <h2 className="text-base font-bold mb-3">Catalogue &amp; people</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {[
            [BookOpen, 'Books', overview.content.books.published, overview.content.books.draft + ' draft', '/admin/books', 'books.read'],
            [GraduationCap, 'Courses', overview.content.courses.published, overview.content.courses.draft + ' draft', '/admin/coaching', 'coaching.read'],
            [Building2, 'Universities', overview.content.universities.active, overview.content.universities.total + ' listed', '/admin/universities', 'institutions.read'],
            [School, 'Colleges', overview.content.colleges.active, overview.content.colleges.total + ' listed', '/admin/colleges', 'institutions.read'],
            [Users, 'Enrollments', overview.people.activeEnrollments, 'currently active', '/admin/enrollments', 'learning.read'],
            [UserCog, 'Staff', overview.people.staff, 'active accounts', '/admin/staff', 'accounts.roles.manage']
          ].map(([Icon, name, value, sub, to, permission]) => {
            const body = <><Icon aria-hidden="true" size={18} className="text-[#53647c]" /><p className="text-sm mt-2">{name}{['Books', 'Courses'].includes(name) ? ' published' : ['Universities', 'Colleges'].includes(name) ? ' active' : ''}</p><div className="text-2xl leading-tight font-extrabold">{value}</div><p className="text-sm">{sub}</p></>;
            return can(permission) ? <Link key={name} to={to} className="bg-white border rounded-2xl p-4 block hover:border-[#8c9fba] transition-colors">{body}</Link> : <div key={name} className="bg-white border rounded-2xl p-4">{body}</div>;
          })}
        </div>
      </section>}

      <p className="text-sm">Updated {new Date(data.asOf).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' })} IST. Money collected counts confirmed payments only, before gateway fees and refunds.</p>
    </div>}
  </div>;
};
