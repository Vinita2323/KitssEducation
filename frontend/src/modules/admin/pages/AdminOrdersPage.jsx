import { statusLabel, userMessage } from '../../../shared/ui/displayText';
import { AdminSelect } from '../components/AdminFields';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { httpClient } from '../../../shared/api/httpClient';
import { authenticatedWrite } from '../../user/services/authService';
import { useAuth } from '../../user/context/AuthContext';
import { Pagination } from '../../user/components/common/Pagination';
import { RefreshCw, Receipt } from 'lucide-react';
import { useDialogFocus } from '../../../shared/ui/useDialogFocus';
import { AdminCard, AdminEmpty, AdminMeta, AdminPageHeader, AdminStatus, AdminTable, AdminToolbar } from '../components/AdminUI';

export function AdminOrdersPage() {
  const {can}=useAuth();const [page,setPage]=useState(1),[status,setStatus]=useState(''),[queue,setQueue]=useState(''),[data,setData]=useState({data:[]}),[error,setError]=useState(''),[version,setVersion]=useState(0),[selected,setSelected]=useState(null);
  useEffect(()=>{const c=new AbortController();setSelected(null);const q=new URLSearchParams({page:String(page),...(status?{status}:{}),...(queue?{reconciliation:queue}:{})});httpClient.request('/admin/orders?'+q,{signal:c.signal}).then(setData).catch(e=>{if(e.code!=='ABORTED')setError(e.message);});return()=>c.abort();},[page,status,queue,version]);
  // A proper modal (focus kept inside, page behind inert, Escape closes) like the other admin dialogs.
  const detailsDialog=useDialogFocus(Boolean(selected),()=>setSelected(null));
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
      <td><p>{statusLabel(row.orderStatus)} / {statusLabel(row.activationStatus)}</p><AdminMeta>Payment: {statusLabel(row.paymentStatus)}</AdminMeta>{row.refundRequest && <div className="mt-1">{can('refunds.read') ? <Link to="/admin/refunds" className="inline-flex items-center text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 hover:bg-amber-100">Refund: {statusLabel(row.refundRequest.status)}</Link> : <span className="inline-flex items-center text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Refund: {statusLabel(row.refundRequest.status)}</span>}</div>}</td>
      <td><AdminStatus value={row.reconciliation.state} /><AdminMeta>{userMessage(row.reconciliation.lastError)}</AdminMeta></td>
      <td><div className="admin-actions"><button onClick={()=>detail(row)} className="admin-btn admin-btn-ghost admin-btn-sm">Payment details</button><button disabled={!can('commerce.reconcile')} onClick={()=>reconcile(row)} className="admin-btn admin-btn-secondary admin-btn-sm">Check payment status</button></div></td>
    </tr>)}</tbody></table>{!data.data.length&&<AdminEmpty icon={Receipt}><p>No matching orders.</p></AdminEmpty>}</AdminTable>
    <Pagination meta={data.meta} onChange={setPage}/>
    {selected && (
      <div
        className="fixed inset-0 z-50 bg-[#0A1D3F]/70 p-3 sm:p-4 flex items-center justify-center overflow-y-auto animate-in fade-in duration-150"
        onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}
      >
        <AdminCard
          ref={detailsDialog}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          aria-label="Payment details"
          title="Payment details"
          actions={<button type="button" onClick={() => setSelected(null)} className="admin-btn admin-btn-ghost admin-btn-sm" aria-label="Close payment details">Close</button>}
          bodyClassName="space-y-3 text-sm"
          className="w-full max-w-lg max-h-[92vh] overflow-y-auto bg-white rounded-2xl shadow-2xl text-left"
        >
          <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1">
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">Reference & Provider</span>
            <p className="font-mono text-xs break-all text-[#0A1D3F]">
              {selected.reference} / {selected.providerOrderId||'No Razorpay order'} / {selected.capturedPaymentId||'No confirmed payment'}
            </p>
          </div>
          {selected.investigation && <p className="p-2.5 rounded-lg bg-amber-50 text-amber-800 text-xs font-semibold">{selected.investigation}</p>}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">Payment Verification Attempts</span>
            {selected.attempts?.length ? selected.attempts.map((a,i)=><p key={i} className="text-xs text-[#53647c] break-all p-1.5 bg-gray-50 rounded-lg">{a.paymentId}: <strong className="text-[#0A1D3F]">{a.status}</strong>; verified through {a.source}</p>) : <p className="text-xs text-[#64748B]">No attempts recorded.</p>}
          </div>
          {selected.eventHistory?.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">Event History</span>
              {selected.eventHistory.map(e=><p key={e.id} className="text-xs text-[#53647c] break-all p-1.5 bg-gray-50 rounded-lg">Event {e.id}: <strong className="text-[#0A1D3F]">{e.state}</strong>; attempts {e.attempts}; {e.lastError||'No processing error'}</p>)}
            </div>
          )}
          <AdminMeta>Tax invoices and refunds are not available here yet. Contact your finance administrator.</AdminMeta>
        </AdminCard>
      </div>
    )}
  </div>;
}
