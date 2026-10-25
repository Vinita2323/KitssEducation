import React, { useEffect, useState } from 'react';
import { FinancialSummary } from './AdminOrdersPage';
import { httpClient } from '../../../shared/api/httpClient';
export const AdminDashboardPage = () => {
  const [data, setData] = useState(null), [error, setError] = useState('');
  useEffect(() => { const c = new AbortController(); httpClient.request('/admin/dashboard', { signal: c.signal }).then(r => setData(r.data.operations)).catch(e => { if (!c.signal.aborted) setError(e.message); }); return () => c.abort(); }, []);
  return <div className="space-y-5"><section className="space-y-3"><h1 className="text-xl font-bold text-[#0A1D3F]">Platform overview</h1><p className="text-xs">Total persisted records, including drafts and inactive records. Counts do not represent approvals, active learners or revenue.</p>{error && <p role="alert">{error}</p>}{!data && !error && <p role="status">Loading platform counts...</p>}<div className="grid grid-cols-2 lg:grid-cols-3 gap-3">{Object.entries(data?.totals || {}).map(([key, value]) => <div key={key} className="bg-white border rounded-xl p-3 break-words"><p className="text-xs">{key}</p><strong>{value}</strong></div>)}</div>{data && <p className="text-xs">As of {new Date(data.asOf).toLocaleString()}</p>}</section><FinancialSummary /></div>;
};
