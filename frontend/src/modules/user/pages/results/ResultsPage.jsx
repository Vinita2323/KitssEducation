import React, { useEffect, useState } from 'react';
import { resultService } from '../../services/resultService';
import { useAuth } from '../../context/AuthContext';
import { ResultMarksheet } from '../../components/results/ResultMarksheet';
export const ResultsPage = () => {
  const {
    user
  } = useAuth();
  const [config, setConfig] = useState(null),
    [issuerId, setIssuerId] = useState(''),
    [issuer, setIssuer] = useState(null);
  const [examId, setExamId] = useState(''),
    [rollNumber, setRoll] = useState(''),
    [fields, setFields] = useState({});
  const [result, setResult] = useState(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [history, setHistory] = useState([]);
  useEffect(() => {
    const c = new AbortController();
    resultService.config(c.signal).then(setConfig).catch(e => {
      if (!c.signal.aborted) setError(e.message);
    });
    if (user) resultService.history(c.signal).then(setHistory).catch(e => {
      if (!c.signal.aborted) setError(e.message);
    });
    return () => c.abort();
  }, [user?.id]);
  useEffect(() => {
    const c = new AbortController();
    setIssuer(null);
    setExamId('');
    setFields({});
    setResult(null);
    if (issuerId) resultService.issuer(issuerId, c.signal).then(setIssuer).catch(e => {
      if (!c.signal.aborted) setError(e.message);
    });
    return () => c.abort();
  }, [issuerId]);
  const search = async event => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setResult(null);
    try {
      setResult(await resultService.lookup({
        issuerId,
        examId,
        rollNumber,
        verificationFields: fields
      }));
      setHistory(await resultService.history());
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return <div className="max-w-3xl mx-auto space-y-4">
    <h1 className="text-xl font-extrabold text-[#0A1D3F]">Examination Results</h1>
    {config && <p className="rounded-xl border bg-white p-4 text-sm">{config.message}</p>}
    {error && <p role="alert" className="p-3 rounded-xl border bg-amber-50">{error}</p>}
    {!user && <p className="text-sm">Sign in with your verified account to look up your results.</p>}
    <form onSubmit={search} className="bg-white border rounded-2xl p-4 space-y-4">
      <label className="block text-sm">Issuer<select aria-label="Result issuer" className="block w-full border rounded-xl p-3 mt-1" value={issuerId} onChange={e => setIssuerId(e.target.value)}><option value="">Choose an issuer</option>{config?.issuers.map(i => <option key={i.id} value={i.id}>{i.fullName}</option>)}</select></label>
      {config && !config.issuers.length && <p className="text-sm text-slate-500">No authorized issuer is currently available.</p>}
      {issuer && <><label className="block text-sm">Exam<select aria-label="Result exam" required className="block w-full border rounded-xl p-3 mt-1" value={examId} onChange={e => setExamId(e.target.value)}><option value="">Choose an exam</option>{issuer.exams.map(e => <option key={e.id} value={e.id}>{e.title} / {e.year} / {e.session}</option>)}</select></label>
        <label className="block text-sm">Roll number<input aria-label="Roll number" required maxLength={80} value={rollNumber} onChange={e => setRoll(e.target.value)} className="block w-full border rounded-xl p-3" /></label>
        {issuer.fieldSchema.map(f => <label className="block text-sm" key={f.id}>{f.label}<input aria-label={f.label} type={f.type === 'date' ? 'date' : 'text'} required={f.required} maxLength={120} value={fields[f.id] ?? ''} onChange={e => setFields(p => ({
            ...p,
            [f.id]: e.target.value
          }))} className="block w-full border rounded-xl p-3" /></label>)}
        <button disabled={busy || !user || !examId} className="bg-[#0A1D3F] text-white rounded-xl p-3 disabled:opacity-50">{busy ? 'Searching...' : 'Check result'}</button></>}
    </form>
    {result && <ResultMarksheet result={result} onBack={() => setResult(null)} onNewSearch={() => {
      setResult(null);
      setRoll('');
    }} />}
    {user && <section className="bg-white border rounded-2xl p-4"><h2 className="font-bold">My results</h2>{!history.length && <p className="text-sm text-slate-500">No available published results.</p>}{history.map(row => <div className="py-3 border-b text-sm" key={row.id}>{row.issuerName} - {row.examTitle} / {row.rollNormalized}<p>{row.totals.obtained} / {row.totals.max} ({row.totals.percentage}%) - {row.totals.status}</p><p className="text-xs">Select issuer and exam above to confirm details and open the full record.</p></div>)}</section>}
  </div>;
};
