import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { resultService } from '../../services/resultService';
import { useAuth } from '../../context/AuthContext';
import { ResultTypeSelector } from '../../components/results/ResultTypeSelector';
import { BoardSelector } from '../../components/results/BoardSelector';
import { ResultSearchForm } from '../../components/results/ResultSearchForm';
import { ResultLoading } from '../../components/results/ResultLoading';
import { ResultNotFound } from '../../components/results/ResultNotFound';
import { ResultMarksheet } from '../../components/results/ResultMarksheet';
import { ResultAdBanner } from '../../components/results/ResultAdBanner';

// Board cards are informational until KITSS has an authorised board result source.
const boards = [
  { id: 'cbse', code: 'CBSE', name: 'CBSE', fullName: 'Central Board of Secondary Education' },
  { id: 'cisce', code: 'CISCE', name: 'ICSE / ISC', fullName: 'Council for the Indian School Certificate Examinations' },
  { id: 'state', code: 'STATE', name: 'State Board', fullName: 'State Board of Secondary & Higher Secondary Education' },
];
const sectionTitles = { university: 'Select University', institute: 'Select Institute / School' };
const shortCode = row => String(row?.code || row?.name || '').replace(/^DEMO[-_ ]?/i, '').slice(0, 8).toUpperCase();

export function ResultsPage() {
  const {user}=useAuth();
  const [config,setConfig]=useState(null),[step,setStep]=useState('landing'),[type,setType]=useState('school'),[issuerId,setIssuerId]=useState(''),[issuer,setIssuer]=useState(null);
  const [values,setValues]=useState({}),[result,setResult]=useState(null),[error,setError]=useState(''),[loadingIssuer,setLoadingIssuer]=useState(false);
  const [history,setHistory]=useState([]),[historyPage,setHistoryPage]=useState(1),[more,setMore]=useState(false),[historyBusy,setHistoryBusy]=useState(false);
  const mounted=useRef(true), historyRequest=useRef(null);
  useEffect(()=>{mounted.current=true;const c=new AbortController();resultService.config(c.signal).then(v=>{if(!c.signal.aborted)setConfig(v);}).catch(e=>{if(!c.signal.aborted)setError(e.message);});return()=>{mounted.current=false;c.abort();historyRequest.current?.abort();};},[]);
  const loadHistory=async page=>{if(!user?.emailVerified)return;historyRequest.current?.abort();const c=new AbortController();historyRequest.current=c;setHistoryBusy(true);try{const r=await resultService.historyPage(page,c.signal);if(!c.signal.aborted&&mounted.current){setHistory(v=>page===1?r.data:[...v,...r.data.filter(item=>!v.some(old=>old.id===item.id))]);setHistoryPage(page);setMore(r.meta.hasMore);}}catch(e){if(!c.signal.aborted&&mounted.current)setError(e.message);}finally{if(!c.signal.aborted&&mounted.current)setHistoryBusy(false);}};
  useEffect(()=>{loadHistory(1);},[user?.id,user?.emailVerified]);
  useEffect(()=>{const c=new AbortController();setIssuer(null);if(issuerId){setLoadingIssuer(true);resultService.issuer(issuerId,c.signal).then(v=>{if(!c.signal.aborted)setIssuer(v);}).catch(e=>{if(!c.signal.aborted)setError(e.message);}).finally(()=>{if(!c.signal.aborted)setLoadingIssuer(false);});}return()=>c.abort();},[issuerId]);
  const [board,setBoard]=useState(null);
  const formConfig=useMemo(()=>issuer?{...issuer,code:shortCode(issuer),fields:[{id:'examId',label:'Examination / Class / Course',type:'select',required:true,options:[{value:'',label:'Select examination'},...issuer.exams.map(e=>({value:e.id,label:[e.title,e.level,e.year,e.session].filter(Boolean).join(' / ')}))]},{id:'rollNumber',label:'Roll number',type:'text',required:true,maxLength:80,placeholder:'e.g. 2026-0001'},...issuer.fieldSchema.map((f,i,all)=>({...f,maxLength:120,placeholder:f.type==='date'?undefined:'Enter '+f.label.toLowerCase(),gridSpan:i===all.length-1&&all.length%2?'full':undefined}))]}:null,[issuer]);
  const chooseType=value=>{setType(value);setIssuerId('');setIssuer(null);setBoard(null);setValues({});setResult(null);setError('');setStep('select');};
  const chooseIssuer=value=>{if(value!==issuerId)setValues({});setIssuerId(value);setError('');setStep('form');};
  const search=async payload=>{if(!user?.emailVerified)return;setValues(payload);setStep('loading');setError('');setResult(null);try{const verificationFields=Object.fromEntries(issuer.fieldSchema.map(f=>[f.id,payload[f.id]||'']));const found=await resultService.lookup({issuerId,examId:payload.examId,rollNumber:payload.rollNumber,verificationFields});if(!mounted.current)return;setResult(found);setStep('result');loadHistory(1);}catch(e){if(mounted.current){setError(e.message);setStep('not_found');}}};
  const back=()=>{setError('');setResult(null);if(step==='select'&&board){setBoard(null);return;}setStep(step==='select'?'landing':['result','not_found'].includes(step)?'form':'select');};
  const issuers=(config?.issuers||[]).filter(i=>i.type===type).map(i=>({...i,code:shortCode(i)}));
  return <div className={'space-y-2.5 w-full mx-auto min-w-0 '+(step==='result'?'max-w-2xl':'max-w-md sm:max-w-lg')}>
    <div className="no-print flex justify-between items-center gap-2"><h1 className="text-base font-bold text-[#0A1D3F]">Examination Results</h1>{step!=='landing'&&<button type="button" disabled={step==='loading'} onClick={back} className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-slate-200 bg-white text-xs font-semibold"><ArrowLeft className="w-3.5 h-3.5 text-orange-500"/>Back</button>}</div>
    <ResultAdBanner src="/banners/results-banner-coaching.jpg" alt="Explore coaching courses" to="/coaching"/>
    {error&&!['not_found','result'].includes(step)&&<p role="alert" className="text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">{error}</p>}
    {step==='landing'&&<ResultTypeSelector selectedType={null} onSelectType={chooseType}/>}
    {step==='select'&&type==='school'&&(board?<div className="bg-white rounded-xl border border-slate-200/90 p-3 sm:p-4 shadow-2xs space-y-3"><div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100"><div className="flex items-center gap-2 min-w-0"><span className="px-2 py-0.5 rounded-md bg-[#0A1D3F] text-[#FF8A00] font-black text-xs shrink-0">{board.code}</span><h2 className="text-xs sm:text-sm font-bold text-[#0A1D3F] truncate">{board.fullName}</h2></div><button type="button" onClick={()=>setBoard(null)} className="text-[11px] font-bold text-slate-600 hover:text-[#FF8A00] border border-slate-200/90 hover:border-[#FF8A00] px-2 py-0.5 rounded-md transition-colors shrink-0 cursor-pointer">Change</button></div><h3 className="text-sm font-bold text-[#0A1D3F]">Board Result</h3><p className="text-xs text-slate-600 leading-relaxed">Online {board.name} results are not available on KITSS yet. Please use your board’s official result website.</p></div>:<BoardSelector boards={boards} selectedBoardId={null} onSelectBoard={id=>setBoard(boards.find(b=>b.id===id))} resultType="school"/>)}
    {step==='select'&&type!=='school'&&(!config?<p role="status" className="text-xs text-slate-500">Loading institutions...</p>:issuers.length?<BoardSelector boards={issuers} selectedBoardId={issuerId} onSelectBoard={chooseIssuer} resultType={type}/>:<div className="space-y-2"><div className="flex items-center justify-between pb-1.5 border-b border-slate-100"><h2 className="text-xs sm:text-sm font-bold text-[#0A1D3F]">{sectionTitles[type]}</h2><span className="text-[10px] font-semibold text-slate-400">0 Available</span></div><p className="bg-white border border-slate-200/90 rounded-lg p-3 text-xs text-slate-600 shadow-2xs">{type==='university'?'University':'Institute, school and coaching'} results will appear here after they are made available by KITSS.</p></div>)}
    {step==='form'&&(loadingIssuer?<p role="status">Loading examinations...</p>:issuer&&<>{issuer.exams.length? <><p className="text-xs text-slate-500">Enter your examination details to view your published result.</p>{!user?.emailVerified&&<p className="bg-orange-50 rounded-lg p-3 text-sm"><Link to="/login" className="font-semibold underline">Sign in with a verified account</Link> to check your results.</p>}<ResultSearchForm boardConfig={formConfig} resultType={type} initialValues={values} onSubmit={search} disabled={!user?.emailVerified} onChangeBoard={()=>setStep('select')}/></>:<p className="bg-white border border-slate-200 rounded-lg p-4 text-sm">No published examinations are available for this institution yet.</p>}</>)}
    {step==='loading'&&<ResultLoading boardName={issuer?.fullName}/>}
    {step==='not_found'&&<ResultNotFound searchedRoll={values.rollNumber} message={error} onTryAgain={()=>{setError('');setStep('form');}} onReset={()=>{setError('');setStep('landing');}}/>}
    {step==='result'&&result&&<ResultMarksheet result={result} onBack={()=>setStep('form')} onNewSearch={()=>{setResult(null);setValues({});setStep('landing');}}/>}
    <ResultAdBanner src="/banners/results-banner-books.jpg" alt="Explore books and study materials" to="/books"/>
    {user?.emailVerified&&<section className="no-print bg-white border border-slate-200 rounded-lg p-3 space-y-2"><h2 className="font-bold text-sm">My results</h2>{!history.length&&!historyBusy&&<p className="text-xs text-slate-500">No published results are available for your account yet.</p>}{history.map(row=><div key={row.id} className="text-xs border-t border-slate-100 pt-2 space-y-1"><p className="font-semibold">{row.issuerName} — {row.examTitle}</p><p>{row.rollNormalized}: {row.totals.obtained} / {row.totals.max} ({row.totals.percentage}%) — {row.totals.status}</p><button className="underline" type="button" onClick={()=>{setType(row.issuerType||'institute');setIssuerId(row.issuerId);setValues({examId:String(row.examId),rollNumber:row.rollNormalized});setResult(null);setError('');setStep('form');}}>View result</button></div>)}{historyBusy&&<p role="status" className="text-xs">Loading your results...</p>}{more&&<button type="button" disabled={historyBusy} onClick={()=>loadHistory(historyPage+1)} className="text-xs underline">Load more results</button>}</section>}
  </div>;
}
