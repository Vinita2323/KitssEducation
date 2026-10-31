import { statusLabel, userMessage } from '../../../shared/ui/displayText';
import { AdminSelect } from '../components/AdminFields';
import React, { useEffect, useState } from 'react';
import { httpClient } from '../../../shared/api/httpClient';
import { authenticatedWrite } from '../../user/services/authService';
import { useAuth } from '../../user/context/AuthContext';
import { Pagination } from '../../user/components/common/Pagination';
import { RefreshCw, Receipt } from 'lucide-react';
import { AdminCard, AdminEmpty, AdminMeta, AdminPageHeader, AdminStatus, AdminTable, AdminToolbar } from '../components/AdminUI';

export function AdminOrdersPage() {
  const {can}=useAuth();const [page,setPage]=useState(1),[status,setStatus]=useState(''),[queue,setQueue]=useState(''),[data,setData]=useState({data:[]}),[error,setError]=useState(''),[version,setVersion]=useState(0),[selected,setSelected]=useState(null);
  useEffect(()=>{const c=new AbortController();setSelected(null);const q=new URLSearchParams({page:String(page),...(status?{status}:{}),...(queue?{reconciliation:queue}:{})});httpClient.request('/admin/orders?'+q,{signal:c.signal}).then(setData).catch(e=>{if(e.code!=='ABORTED')setError(e.message);});return()=>c.abort();},[page,status,queue,version]);
  const detail=async row=>{try{setSelected((await httpClient.request('/admin/orders/'+row.id)).data);}catch(e){setError(e.message);}};
  const reconcile=async row=>{try{await authenticatedWrite('/admin/orders/'+row.id+'/reconcile',{});setVersion(v=>v+1);}catch(e){setError(e.message);}};
  return <div className="space-y-5 text-[#0A1D3F]">
    <AdminPageHeader title={<>Orders &amp; Payment Review</>} description="Test Mode only. Check payment status with Razorpay and retry unfinished processing. An unpaid order cannot be marked paid." />
    <AdminToolbar>
      <AdminSelect aria-label="Payment status filter" className="border rounded-xl p-2" value={status} onChange={e=>{setStatus(e.target.value);setPage(1);}}><option value="">All payment states</option>{['pending','authorized','failed','captured'].map(s=><option key={s} value={s}>{statusLabel(s)}</option>)}</AdminSelect>
      <AdminSelect aria-label="Payment check filter" className="border rounded-xl p-2" value={queue} onChange={e=>{setQueue(e.target.value);setPage(1);}}><option value="">All payment check states</option>{['pending','leased','dead','done'].map(s=><option key={s} value={s}>{statusLabel(s)}</option>)}</AdminSelect>
      <button onClick={()=>setVersion(v=>v+1)} className="admin-btn admin-btn-secondary admin-toolbar-end"><RefreshCw aria-hidden="true" size={15}/>Refresh orders</button>
    </AdminToolbar>
    {error&&<p role="alert" className="text-red-700">{error}</p>}
    <AdminTable><table className="w-full text-sm"><thead><tr>{['Order','Product / historical amount','Payment / access','Payment checks','Actions'].map(t=><th key={t} className="p-3 text-left">{t}</th>)}</tr></thead><tbody>{data.data.map(row=><tr key={row.id}>
      <td><p className="font-semibold break-all">{row.reference}</p><AdminMeta>{row.simulated?'Simulated Test Mode':'Razorpay Test Mode'}</AdminMeta></td>
      <td><p className="break-words">{row.product.title}</p><p className="font-semibold tabular-nums">INR {(row.amountMinor/100).toFixed(2)}</p></td>
      <td><p>{statusLabel(row.orderStatus)} / {statusLabel(row.activationStatus)}</p><AdminMeta>Payment: {statusLabel(row.paymentStatus)}</AdminMeta></td>
      <td><AdminStatus value={row.reconciliation.state} /><AdminMeta>{userMessage(row.reconciliation.lastError)}</AdminMeta></td>
      <td><div className="admin-actions"><button onClick={()=>detail(row)} className="admin-btn admin-btn-ghost admin-btn-sm">Payment details</button><button disabled={!can('commerce.reconcile')} onClick={()=>reconcile(row)} className="admin-btn admin-btn-secondary admin-btn-sm">Check payment status</button></div></td>
    </tr>)}</tbody></table>{!data.data.length&&<AdminEmpty icon={Receipt}><p>No matching orders.</p></AdminEmpty>}</AdminTable>
    <Pagination meta={data.meta} onChange={setPage}/>
    {selected&&<AdminCard aria-label="Payment details" title="Payment details" bodyClassName="space-y-2 text-sm">
      <p className="break-all">{selected.reference} / {selected.providerOrderId||'No Razorpay order'} / {selected.capturedPaymentId||'No confirmed payment'}</p>
      <p>{selected.investigation||'No investigation flag'}</p>
      {selected.attempts.map((a,i)=><p key={i} className="break-all">{a.paymentId}: {a.status}; verified through {a.source}</p>)}
      {selected.eventHistory?.map(e=><p key={e.id} className="break-all">Event {e.id}: {e.state}; attempts {e.attempts}; {e.lastError||'No processing error'}</p>)}
      <AdminMeta>Tax invoices and refunds are not available here yet. Contact your finance administrator.</AdminMeta>
    </AdminCard>}
  </div>;
}
