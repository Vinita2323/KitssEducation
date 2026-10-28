import React, { useEffect, useState } from 'react';
import { httpClient } from '../../../../shared/api/httpClient';
export function FranchiseFeeStatus() {
  const [state, setState] = useState(null), [error, setError] = useState('');
  useEffect(() => { const c = new AbortController(); httpClient.request('/public/franchise-fees', { signal: c.signal }).then(r => setState(r.data)).catch(e => { if (!c.signal.aborted) setError(e.message); }); return () => c.abort(); }, []);
  return <section aria-label="Franchise fee and renewal status" className="p-3 border rounded-xl text-sm break-words"><h3 className="font-bold">Franchise fee and renewal status</h3>{error ? <p role="status">{error}</p> : !state ? <p>Loading fee configuration...</p> : <><p>{state.state.replaceAll('_', ' ')}</p>{['joining','renewal'].map(k => state[k] && <p key={k}>{k}: {state[k].enabled ? 'INR ' + (state[k].amountMinor / 100).toFixed(2) : 'disabled'}</p>)}<p>Applications follow the published franchise policy. Review, agreement acceptance and any verified payment are required before activation.</p></>}</section>;
}
