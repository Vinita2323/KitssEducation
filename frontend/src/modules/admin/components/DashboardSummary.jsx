import React, { useEffect, useId, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { httpClient } from '../../../shared/api/httpClient';

export function FinancialSummary() {
  const [params,setParams] = useSearchParams(), id=useId();
  const query=new URLSearchParams(['from','to','paymentMode'].filter(k=>params.get(k)).map(k=>[k,params.get(k)])).toString();
  const [draft,setDraft]=useState(()=>Object.fromEntries(['from','to','paymentMode'].map(k=>[k,params.get(k)||''])));
  const [data,setData]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(true);
  useEffect(()=>{setDraft(Object.fromEntries(['from','to','paymentMode'].map(k=>[k,params.get(k)||''])));},[query]);
  useEffect(()=>{const c=new AbortController();setData(null);setLoading(true);setError('');httpClient.request('/admin/dashboard'+(query?'?'+query:''),{signal:c.signal}).then(r=>{if(!c.signal.aborted)setData(r.data);}).catch(e=>{if(!c.signal.aborted)setError(e.message);}).finally(()=>{if(!c.signal.aborted)setLoading(false);});return()=>c.abort();},[query]);
  const apply=e=>{e.preventDefault();if(draft.from&&draft.to&&draft.from>draft.to){setError('Start date must not follow end date.');return;}setError('');setParams(Object.fromEntries(Object.entries(draft).filter(([,v])=>v)));};
  const reset=()=>{setDraft({from:'',to:'',paymentMode:''});setError('');setParams({});};
  return <section className="space-y-3" aria-labelledby={id+'-title'} aria-busy={loading}>
    <h2 id={id+'-title'} className="text-xl font-extrabold text-[#0A1D3F]">Test Mode Financial Summary</h2>
    <p id={id+'-help'}>UTC calendar days, including the entire end date. Captured groups use verified capture time; other order groups use order creation; failed attempts use observation time. Platform counts and event queues remain lifetime totals.</p>
    <form onSubmit={apply} aria-label="Dashboard financial filters" aria-describedby={id+'-help'} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 items-end">
      {['from','to'].map(k=><label key={k}>{k==='from'?'Start date':'End date'}<input aria-label={k==='from'?'Start date':'End date'} type="date" min="1970-01-01" max="9998-12-31" className="block w-full border rounded-lg p-2" value={draft[k]} onChange={e=>setDraft(d=>({...d,[k]:e.target.value}))} aria-invalid={error.startsWith('Start date must')} aria-describedby={error.startsWith('Start date must')?id+'-error':undefined}/></label>)}
      <label>Payment environment<select aria-label="Payment environment" className="block w-full border rounded-lg p-2" value={draft.paymentMode} onChange={e=>setDraft(d=>({...d,paymentMode:e.target.value}))}><option value="">All stored environments</option><option value="test">Test Mode</option></select></label>
      <button className="border p-2 rounded-lg bg-[#0A1D3F] text-white">Apply financial filters</button><button type="button" className="border p-2 rounded-lg" onClick={reset}>Clear financial filters</button>
    </form>
    <p className="text-sm">Only Test Mode is stored. Verified payment methods (UPI/card/wallet) are unavailable; no method is inferred from the provider.</p>
    <p role="status">Active financial filters: {params.get('from')||'Any start'} through {params.get('to')||'Any end'}; {params.get('paymentMode')||'all stored environments'} (UTC).</p>
    <p>Gross captured value is not net revenue, profit, tax or settlement. Amounts on non-captured groups are order values, never captured receipts. Simulated records are separate.</p>
    {error&&<p id={id+'-error'} role="alert" className="text-red-800">{error}</p>}{loading&&<p role="status">Loading verified records...</p>}
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{data?.groups?.map((g,i)=><article key={i} className="bg-white border rounded-2xl p-4"><p>{g._id.simulated?'SIMULATED TEST':'Razorpay Test Mode'}</p><h3 className="font-bold">{g._id.status}; fulfillment {g._id.fulfilled}</h3><p>{g.count} orders; INR {(g.amountMinor/100).toFixed(2)}</p></article>)}</div>
    {!loading&&data&&!data.groups.length&&<p>No matching commerce records.</p>}
    {data?.failedAttempts?.map((g,i)=><p key={i}>{g._id?'Simulated':'Razorpay Test Mode'} failed attempts: {g.count}</p>)}
    {data?.eventQueue?.map((g,i)=><p key={i}>{g._id.provider==='fake'?'Simulated':'Razorpay Test Mode'} lifetime event queue {g._id.state}: {g.count}</p>)}
  </section>;
}
