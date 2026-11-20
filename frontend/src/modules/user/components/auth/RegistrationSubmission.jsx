import { Link } from 'react-router-dom';
import { statusLabel } from '../../../../shared/ui/displayText';
import React, { useEffect, useRef, useState } from 'react';
import { httpClient } from '../../../../shared/api/httpClient';
import { authenticatedWrite } from '../../services/authService';
import { contentService } from '../../services/contentService';
import { commerceService } from '../../services/commerceService';
import { openRazorpayCheckout } from '../../services/razorpayService';

export function RegistrationSubmission({ application, onChange, beforeSubmit }) {
  const [config, setConfig] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [replacing, setReplacing] = useState({});
  const [guardian, setGuardian] = useState({ guardianName: '', relationship: '', accepted: false });
  const orderKey = useRef(crypto.randomUUID());
  const attemptKey = useRef(crypto.randomUUID());

  useEffect(() => {
    const c = new AbortController();
    httpClient.request('/public/registration-config', { signal: c.signal })
      .then(r => setConfig(r.data))
      .catch(e => { if (!c.signal.aborted) setMessage(e.message); });
    return () => c.abort();
  }, [application.kind]);

  const policy = config?.policies?.[application.kind];
  const editable = ['draft', 'needs_changes'].includes(application.status);

  const action = async work => {
    setBusy(true);
    setMessage('');
    try { await work(); }
    catch (e) { setMessage(e.message); }
    finally { setBusy(false); }
  };

  const refresh = async () => onChange((await httpClient.request('/registration-applications/' + application.id + '/status')).data);

  const handleUpload = (e, doc) => {
    const file = e.target.files?.[0];
    if (!file) return;
    action(async () => {
      if (policy.upload && (!policy.upload.mime.includes(file.type) || file.size > policy.upload.maxBytes)) {
        throw new Error('File does not meet the configured type/size requirements.');
      }
      const asset = await contentService.upload(file, 'registration_document');
      if (asset.status !== 'ready') {
        throw new Error('Your document has not passed its security check yet. Please try again later or contact support.');
      }
      const updated = await authenticatedWrite('/registration-applications/' + application.id + '/documents', {
        expectedRevision: application.revision,
        key: doc.key,
        assetId: asset.id,
      });
      setReplacing(v => ({ ...v, [doc.key]: false }));
      onChange(updated);
    });
  };

  const attachedByKey = Object.fromEntries((application.documents || []).map(d => [d.key, d]));

  return (
    <section className="space-y-4 border border-slate-200 bg-white rounded-xl p-4 shadow-sm text-sm">
      <div className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Application status: {statusLabel(application.status)}</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Fee status: {statusLabel(application.paymentState)}. Your application is reviewed separately from your login account.
          </p>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold self-start sm:self-auto ${
          application.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
          application.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
          application.status === 'needs_changes' ? 'bg-amber-100 text-amber-800' :
          'bg-slate-100 text-slate-700'
        }`}>
          {statusLabel(application.status)}
        </span>
      </div>

      {application.status === 'needs_changes' && application.reviewFeedback?.length > 0 && (
        <div className="space-y-1 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs">
          <p className="font-semibold text-amber-900">Review feedback from administrator:</p>
          {application.reviewFeedback.map((h, i) => (
            <p key={i} className="text-amber-800">{statusLabel(h.status)}: {h.reason}</p>
          ))}
        </div>
      )}

      {!config?.enabled?.[application.kind] && (
        <p className="text-amber-800 bg-amber-50 p-3 rounded-lg border border-amber-200">
          {config?.unavailableReasons?.[application.kind] ?? 'An approved effective category policy is required before submission or document collection.'}
        </p>
      )}

      {config?.enabled?.[application.kind] && (
        <div className="space-y-2.5">
          <h4 className="font-semibold text-slate-800 text-xs uppercase tracking-wider">Attached Verification Documents</h4>
          <div className="space-y-2">
            {(policy?.documents || []).map(doc => {
              const attached = attachedByKey[doc.key];
              const isReplacing = replacing[doc.key];
              return (
                <div key={doc.key} className={`p-3 rounded-xl border ${attached ? 'bg-emerald-50/60 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${attached ? 'text-emerald-950' : 'text-slate-800'}`}>
                        {attached ? '✓ ' : ''}{doc.label} {doc.required === false ? '(optional)' : '(required)'}
                      </span>
                      {attached ? (
                        <span className="text-[11px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                          Uploaded
                        </span>
                      ) : (
                        <span className="text-[11px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full">
                          Not uploaded yet
                        </span>
                      )}
                    </div>
                    {attached && editable && (
                      <button
                        type="button"
                        onClick={() => setReplacing(v => ({ ...v, [doc.key]: !v[doc.key] }))}
                        className="text-xs text-blue-700 hover:text-blue-900 underline font-medium cursor-pointer"
                      >
                        {isReplacing ? 'Cancel' : 'Replace file'}
                      </button>
                    )}
                  </div>

                  {attached && (
                    <p className="text-xs text-slate-500 mt-1">
                      Status: <span className="font-medium text-slate-700">{attached.status === 'pending' ? 'Pending Admin Review' : statusLabel(attached.status)}</span>
                      {attached.reason ? ` — ${attached.reason}` : ''}
                    </p>
                  )}

                  {(!attached || isReplacing) && editable && (
                    <div className="mt-2 pt-2 border-t border-slate-200/80">
                      <label className="block text-xs text-slate-600 font-medium mb-1">
                        {isReplacing ? `Choose replacement for ${doc.label}:` : `Choose ${doc.label}:`}
                        <input
                          className="block w-full mt-1 text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:bg-[#0A1D3F] file:text-white file:text-xs cursor-pointer hover:file:opacity-90"
                          type="file"
                          accept={policy.upload?.mime.join(',') ?? 'application/pdf,image/png,image/jpeg'}
                          onChange={e => handleUpload(e, doc)}
                        />
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {editable && config?.enabled?.[application.kind] && (
        <fieldset disabled={busy} className="space-y-4 pt-2 border-t border-slate-100">
          {policy?.guardian?.approved && (
            <fieldset className="border border-slate-200 bg-slate-50/50 p-3 rounded-xl space-y-2">
              <legend className="font-semibold text-slate-800 px-1 text-xs">Parent or guardian consent (optional)</legend>
              <p className="text-xs text-slate-500">Applicants under 18 may add a parent or guardian's consent. You can submit without it.</p>
              <p className="text-xs italic text-slate-700 bg-white p-2 rounded-lg border border-slate-200">{policy.guardian.text}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[['guardianName', 'Parent or guardian name'], ['relationship', 'Relationship to applicant']].map(([k, label]) => (
                  <label className="block text-xs text-slate-700 font-medium" key={k}>
                    {label}
                    <input
                      className="block border border-slate-300 rounded-lg p-2 w-full mt-1 bg-white"
                      value={guardian[k]}
                      onChange={e => setGuardian(v => ({ ...v, [k]: e.target.value }))}
                    />
                  </label>
                ))}
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-700 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={guardian.accepted}
                  onChange={e => setGuardian(v => ({ ...v, accepted: e.target.checked }))}
                  className="rounded text-[#0A1D3F]"
                />
                The parent or guardian agrees to the statement above
              </label>
            </fieldset>
          )}

          <label className="flex items-start gap-2 text-sm text-slate-800 font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={accepted}
              onChange={e => setAccepted(e.target.checked)}
              className="mt-0.5 rounded text-[#0A1D3F]"
            />
            <span>
              I confirm the application information and submit for admin review.
              {application.kind === 'teacher' ? ' I understand KITSS may publish my approved teacher profile; private contact details and documents remain private.' : ''}
            </span>
          </label>

          <button
            type="button"
            className="w-full sm:w-auto px-5 py-2.5 bg-[#0A1D3F] hover:bg-[#07152d] text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            disabled={!accepted || busy}
            onClick={() => {
              if (beforeSubmit && !beforeSubmit()) return;
              action(async () => onChange(await authenticatedWrite('/registration-applications/' + application.id + '/submit', {
                expectedRevision: application.revision,
                declaration: true,
                ...(guardian.accepted ? { guardianConsent: { ...guardian, version: policy.guardian.version } } : {}),
              })));
            }}
          >
            {busy ? 'Submitting...' : 'Submit registration for review'}
          </button>
        </fieldset>
      )}

      {application.feeSnapshot?.feeRequired && application.status !== 'draft' && application.paymentState !== 'verified' && (
        <button
          type="button"
          disabled={busy}
          className="w-full sm:w-auto p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-sm"
          onClick={() => action(async () => {
            const order = await commerceService.create({ kind: 'registration_fee', id: application.id }, orderKey.current);
            await openRazorpayCheckout({
              orderId: order.id,
              attemptKey: order.attemptId || attemptKey.current,
              onSuccess: () => action(refresh),
              onDismiss: () => setMessage('Checkout cancelled; no payment or activation inferred.'),
              onFailure: e => setMessage(e.message),
            });
          })}
        >
          Pay approved registration fee: INR {(application.feeSnapshot.amountMinor / 100).toFixed(2)}
        </button>
      )}

      {application.kind === 'study' && <p className="text-xs text-slate-500">KITSS will contact you and handle further guidance and arrangements directly.</p>}
      {application.kind === 'tuition' && <Link to="/coaching" className="block text-xs text-blue-700 hover:underline">Browse courses and enroll in Coaching</Link>}
      {application.teacherProfileId && <Link to="/about" className="block text-xs text-blue-700 hover:underline">View KITSS faculty</Link>}

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
        <button type="button" disabled={busy} className="text-xs text-slate-600 hover:text-slate-900 underline cursor-pointer" onClick={() => action(refresh)}>
          Refresh application status
        </button>
        {message && <p role="status" className="text-xs text-red-600 font-medium">{message}</p>}
      </div>
    </section>
  );
}
