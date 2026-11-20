import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  UploadCloud,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  X,
  Building2,
  Clock,
  RotateCcw,
  Check,
  Loader2
} from 'lucide-react';
import { statusLabel, userMessage } from '../../../../shared/ui/displayText';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { httpClient } from '../../../../shared/api/httpClient';
import { authenticatedWrite } from '../../services/authService';
import { contentService } from '../../services/contentService';
import { collegeService } from '../../services/collegeService';
import { commerceService } from '../../services/commerceService';
import { openRazorpayCheckout } from '../../services/razorpayService';
import { OriginalFranchiseFields } from './OriginalFranchiseFields';
import { RegistrationAccount } from './RegistrationAccount';

const path = '/franchise-applications';
const steps = ['Institution', 'Affiliation', 'Contact', 'Location', 'Documents'];
const previewPolicy = {
  applicationMode: 'both',
  institutionTypes: ['University', 'College', 'School', 'Institute'],
  minimumYears: 0,
  documents: [],
  agreement: { version: '', text: '' },
  privacyText: ''
};

const empty = () => ({
  institution: { name: '', type: '', yearEstablished: '', website: '' },
  contact: { person: '', email: '', mobile: '', designation: '', alternateMobile: '' },
  location: { address: '', city: '', pincode: '' },
  programsOffered: [],
  universityId: '',
  collegeId: ''
});

export function FranchiseApplicationForm({ onBack }) {
  const { user, loading } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  const [params, setParams] = useSearchParams();
  const [config, setConfig] = useState(null);
  const [row, setRow] = useState(null);
  const [mine, setMine] = useState([]);
  const [form, setForm] = useState(empty);
  const [linked, setLinked] = useState(false);
  const [universities, setUniversities] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [busy, setBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [actionStage, setActionStage] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [renewAccepted, setRenewAccepted] = useState(false);
  const [files, setFiles] = useState({});
  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [pendingAssets, setPendingAssets] = useState({});
  const [replaceDoc, setReplaceDoc] = useState({});
  const [termsOpen, setTermsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [logo, setLogo] = useState(null);

  useEffect(() => () => {
    if (logo?.preview?.startsWith('blob:')) URL.revokeObjectURL(logo.preview);
  }, [logo?.preview]);

  const detailsForm = useRef(null);
  const previousAccount = useRef(user?.id);
  const draftKey = useRef(crypto.randomUUID());
  const orderKeys = useRef({});
  const attemptKeys = useRef({});
  const identity = useRef(user?.id);
  identity.current = user?.id;

  const setApplication = value => {
    setRow(value);
    setLogo(
      value.institution?.logoAssetId
        ? {
            name: 'Saved institution logo',
            size: '',
            preview: '/api/v1/media/' + value.institution.logoAssetId + '/content',
            assetId: value.institution.logoAssetId
          }
        : null
    );
    setForm({
      ...empty(),
      ...value,
      institution: { ...empty().institution, ...value.institution },
      contact: { ...empty().contact, ...value.contact },
      location: { ...empty().location, ...value.location },
      universityId: value.universityId || '',
      collegeId: value.collegeId || ''
    });
    setLinked(Boolean(value.collegeId));
  };

  useEffect(() => {
    const c = new AbortController();
    if (previousAccount.current && previousAccount.current !== user?.id) {
      setForm(empty());
      setLogo(null);
      setLinked(false);
      setStep(0);
    }
    previousAccount.current = user?.id;
    setRow(null);
    setMine([]);
    setOrder(null);
    setAccepted(false);
    setRenewAccepted(false);
    setFiles({});
    setPendingAssets({});
    setReplaceDoc({});
    setBusy(false);
    setError('');
    setMessage('');
    orderKeys.current = {};
    attemptKeys.current = {};
    draftKey.current = crypto.randomUUID();

    httpClient.request('/public/franchise-policy', { signal: c.signal })
      .then(r => { if (!c.signal.aborted) setConfig(r.data); })
      .catch(e => { if (!c.signal.aborted) setError(e.message); });

    commerceService.config(c.signal)
      .then(v => { if (!c.signal.aborted) setPayment(v); })
      .catch(() => {});

    if (user) {
      httpClient.request('/me/franchise-applications', { signal: c.signal })
        .then(r => {
          if (c.signal.aborted) return;
          setMine(r.data);
          const id = params.get('draft');
          if (id) {
            const found = r.data.find(item => item.id === id);
            if (found) setApplication(found);
            else setError('Application not found in your account.');
          }
        })
        .catch(e => { if (!c.signal.aborted) setError(e.message); });
    }
    return () => c.abort();
  }, [user?.id]);

  useEffect(() => {
    const c = new AbortController();
    collegeService.getUniversities()
      .then(v => { if (!c.signal.aborted) setUniversities(v); })
      .catch(() => {});
    return () => c.abort();
  }, []);

  useEffect(() => {
    let alive = true;
    setColleges([]);
    if (form.universityId) {
      collegeService.getCollegesByUniversity(form.universityId)
        .then(v => { if (alive) setColleges(v); })
        .catch(e => { if (alive) setError(e.message); });
    }
    return () => { alive = false; };
  }, [form.universityId]);

  useEffect(() => {
    if (!row?.id || !user) return;
    const c = new AbortController();
    const refresh = () =>
      httpClient.request(path + '/' + row.id + '/status', { signal: c.signal })
        .then(r => { if (!c.signal.aborted) setRow(r.data); })
        .catch(() => {});
    const timer = setInterval(() => {
      if (document.visibilityState !== 'hidden') refresh();
    }, 15000);
    window.addEventListener('focus', refresh);
    return () => {
      c.abort();
      clearInterval(timer);
      window.removeEventListener('focus', refresh);
    };
  }, [row?.id, user?.id]);

  const approvedPolicy = row?.policySnapshot || config?.policy;
  const policy = approvedPolicy || previewPolicy;
  const verified = Boolean(user?.emailVerified);
  const canSave = verified && Boolean(approvedPolicy);
  const editable = !row || (row.workflowVersion === 1 && ['draft', 'needs_changes'].includes(row.status));

  const sameAccount = ticket => {
    if (identity.current !== ticket) throw new Error('Your account changed. Please try again.');
  };

  const run = async action => {
    const ticket = identity.current;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await action();
    } catch (e) {
      if (identity.current === ticket) {
        setError(e.message);
        showError(e.message);
      }
    } finally {
      if (identity.current === ticket) {
        setBusy(false);
        setActionStage('');
      }
    }
  };

  const select = value => {
    setStep(0);
    setApplication(value);
    setAccepted(false);
    setRenewAccepted(false);
    setFiles({});
    setPendingAssets({});
    setReplaceDoc({});
    setOrder(null);
    setError('');
    setMessage('');
    const next = new URLSearchParams(params);
    next.set('type', 'franchise');
    next.set('draft', value.id);
    setParams(next, { replace: true });
  };

  const payload = () => {
    const data = {
      institution: { ...form.institution },
      contact: form.contact,
      location: { ...form.location },
      programsOffered: form.programsOffered
    };
    if (!data.location.stateId) delete data.location.stateId;
    if (data.institution.yearEstablished === '') delete data.institution.yearEstablished;
    else data.institution.yearEstablished = Number(data.institution.yearEstablished);

    if (linked || policy.applicationMode === 'linked') {
      data.universityId = form.universityId;
      data.collegeId = form.collegeId;
    } else if (row) {
      data.universityId = null;
      data.collegeId = null;
    }
    return data;
  };

  const persist = async () => {
    const ticket = identity.current;
    if (!verified) throw new Error('Sign in with a verified account before saving your application.');
    if (!approvedPolicy) throw new Error('Applications are not open yet. Please return when the requirements are available.');
    let data = payload();
    if (logo?.file) {
      let asset = logo.assetId
        ? (await httpClient.request('/media/' + logo.assetId + '/metadata')).data
        : await contentService.upload(logo.file, 'franchise_document');
      sameAccount(ticket);
      setLogo(v => (v?.file === logo.file ? { ...v, assetId: asset.id } : v));
      if (asset.status !== 'ready') throw new Error('Your logo is awaiting a security check. Save again to check it.');
      data.institution.logoAssetId = asset.id;
    } else data.institution.logoAssetId = logo?.assetId || null;

    const value = await authenticatedWrite(
      path + (row ? '/' + row.id : ''),
      {
        ...data,
        ...(row ? { expectedRevision: row.revision } : { idempotencyKey: draftKey.current })
      },
      row ? 'PATCH' : 'POST'
    );
    sameAccount(ticket);
    setRow(value);
    const next = new URLSearchParams(params);
    next.set('type', 'franchise');
    next.set('draft', value.id);
    setParams(next, { replace: true });
    setMine(v => [value, ...v.filter(item => item.id !== value.id)]);
    return value;
  };

  const upload = d =>
    run(async () => {
      const ticket = identity.current;
      if (!files[d.key] && !pendingAssets[d.key]) return;

      setActionStage(`Saving draft for ${d.label}...`);
      let currentApp = row;
      if (!currentApp) {
        currentApp = await persist();
      }

      setActionStage(`Uploading ${d.label}...`);
      let asset = pendingAssets[d.key];
      if (!asset) {
        asset = await contentService.upload(files[d.key], 'franchise_document', crypto.randomUUID(), msg => {
          if (msg) setActionStage(`Uploading ${d.label}: ${msg}`);
        });
      } else {
        asset = (await httpClient.request('/media/' + asset.id + '/metadata')).data;
      }
      sameAccount(ticket);

      if (asset.status !== 'ready') {
        setPendingAssets(v => ({ ...v, [d.key]: asset }));
        setMessage('Your file is being processed. Click Check scan & attach once ready.');
        showInfo('Your file is being processed. Click Check scan & attach once ready.');
        return;
      }

      setActionStage(`Attaching ${d.label}...`);
      const value = await authenticatedWrite(path + '/' + currentApp.id + '/documents', {
        expectedRevision: currentApp.revision,
        key: d.key,
        assetId: asset.id
      });
      sameAccount(ticket);
      setRow(value);
      setPendingAssets(v => {
        const next = { ...v };
        delete next[d.key];
        return next;
      });
      setFiles(v => ({ ...v, [d.key]: null }));
      setReplaceDoc(v => ({ ...v, [d.key]: false }));
      setMessage(d.label + ' uploaded and attached successfully.');
      showSuccess(d.label + ' uploaded and attached successfully.');
    });

  const saveDraftWithDocuments = () => {
    if (!checkSteps(false)) return;
    return run(async () => {
      setSavingDraft(true);
      setActionStage('Saving application draft...');
      try {
        const ticket = identity.current;
        let currentApp = await persist();

        // Upload and attach any selected files that were picked before clicking save
        for (const d of policy.documents || []) {
          if (files[d.key]) {
            setActionStage(`Uploading ${d.label}...`);
            let asset = await contentService.upload(files[d.key], 'franchise_document', crypto.randomUUID(), msg => {
              if (msg) setActionStage(`Uploading ${d.label}: ${msg}`);
            });
            sameAccount(ticket);
            if (asset.status === 'ready') {
              setActionStage(`Attaching ${d.label}...`);
              currentApp = await authenticatedWrite(path + '/' + currentApp.id + '/documents', {
                expectedRevision: currentApp.revision,
                key: d.key,
                assetId: asset.id
              });
              sameAccount(ticket);
              setRow(currentApp);
              setFiles(v => ({ ...v, [d.key]: null }));
              setReplaceDoc(v => ({ ...v, [d.key]: false }));
            }
          }
        }
        setMessage('Draft saved. Attach the required documents before submitting.');
        showSuccess('Application draft saved.');
      } finally {
        setSavingDraft(false);
      }
    });
  };

  const submit = () =>
    run(async () => {
      setSubmitting(true);
      setActionStage('Saving application details...');
      try {
        const ticket = identity.current;
        let saved = await persist();

        // Auto-upload and attach any selected files that haven't been attached yet
        for (const d of policy.documents || []) {
          if (files[d.key]) {
            setActionStage(`Uploading ${d.label}...`);
            let asset = await contentService.upload(files[d.key], 'franchise_document', crypto.randomUUID(), msg => {
              if (msg) setActionStage(`Uploading ${d.label}: ${msg}`);
            });
            sameAccount(ticket);
            if (asset.status === 'ready') {
              setActionStage(`Attaching ${d.label}...`);
              saved = await authenticatedWrite(path + '/' + saved.id + '/documents', {
                expectedRevision: saved.revision,
                key: d.key,
                assetId: asset.id
              });
              sameAccount(ticket);
              setRow(saved);
              setFiles(v => ({ ...v, [d.key]: null }));
              setReplaceDoc(v => ({ ...v, [d.key]: false }));
            }
          }
        }

        setActionStage('Submitting application for KITSS review...');
        const value = await authenticatedWrite(path + '/' + saved.id + '/submit', {
          expectedRevision: saved.revision,
          declaration: { version: policy.agreement.version, accepted }
        });
        sameAccount(ticket);
        setRow(value);
        setMessage('Application submitted. KITSS staff will review your details and documents.');
        showSuccess('Franchise application submitted successfully!');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } finally {
        setSubmitting(false);
      }
    });

  const refresh = async () => {
    const ticket = identity.current;
    const value = (await httpClient.request(path + '/' + row.id + '/status')).data;
    sameAccount(ticket);
    setRow(value);
    showInfo('Application status refreshed.');
    return value;
  };

  const pay = renewal =>
    run(async () => {
      const ticket = identity.current;
      let current = row;
      if (renewal) {
        current = await authenticatedWrite(path + '/' + row.id + '/renewal-agreement', {
          expectedRevision: row.revision,
          agreementVersion: config.policy.agreement.version,
          accepted: renewAccepted
        });
      }
      sameAccount(ticket);
      setRow(current);

      const kind = renewal ? 'franchise_renewal' : 'franchise_joining';
      const key = kind + ':' + row.id + ':' + (renewal ? row.renewalDueAt : 'joining');
      orderKeys.current[key] ??= crypto.randomUUID();
      let pending = order;
      if (!pending || pending.product.kind !== kind) {
        const existing = await commerceService.orders({ type: kind, pageSize: 100 });
        pending = existing.data.find(
          o => o.product.id === row.id && o.product.purchaseSlot === (renewal ? row.renewalDueAt : 'joining') && o.orderStatus !== 'captured'
        );
      }
      pending ??= await commerceService.create({ kind, id: row.id }, orderKeys.current[key]);
      if (identity.current !== ticket) return;
      setOrder(pending);
      attemptKeys.current[pending.id] ??= crypto.randomUUID();

      await openRazorpayCheckout({
        orderId: pending.id,
        attemptKey: pending.attemptId || attemptKeys.current[pending.id],
        onSuccess: async value => {
          if (identity.current !== ticket) return;
          setOrder(value);
          setMessage(value.orderStatus === 'captured' ? 'Payment verified! Checking affiliation status...' : 'Checking payment status.');
          try {
            await refresh();
          } catch (e) {
            setError(e.message);
          }
        },
        onDismiss: () => {
          if (identity.current === ticket) setMessage('Checkout closed. Refresh status to check the payment result.');
        },
        onFailure: e => {
          if (identity.current === ticket) setError(e.message);
        }
      });
    });

  const checkSteps = complete => {
    for (let index = 0; index < 4; index++) {
      for (const control of detailsForm.current?.querySelectorAll(
        `[data-step="${index}"] input,[data-step="${index}"] select,[data-step="${index}"] textarea`
      ) || []) {
        if (!control.checkValidity() && (complete || !control.validity.valueMissing)) {
          setStep(index);
          setMessage('');
          setError(`Check the ${steps[index]} step: ${control.validationMessage}`);
          setTimeout(() => control.reportValidity());
          return false;
        }
      }
    }
    return true;
  };

  if (loading) {
    return (
      <div className="w-full max-w-[768px] mx-auto p-12 text-center text-slate-500 text-sm">
        Checking your session...
      </div>
    );
  }

  return (
    <section className="w-full max-w-[768px] mx-auto bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-4 sm:p-6 lg:p-7 space-y-6">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
        <button
          type="button"
          aria-label="Back to registration options"
          onClick={onBack}
          className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#64748B] hover:text-[#0A1D3F] transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Registration Options
        </button>
        <span className="text-[11px] font-semibold text-[#FF8A00] border border-amber-200 bg-amber-50 rounded-lg px-2.5 py-1 flex items-center gap-1.5 shadow-2xs">
          <ShieldCheck className="w-3.5 h-3.5" /> Franchise Network
        </span>
      </div>

      {/* Title & Introduction */}
      <div className="text-center space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold text-[#0A1D3F]">Franchise Registration</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Register your institution to join the authorized KITSS franchise network.
        </p>
      </div>

      {/* Notifications */}
      {error && (
        <div role="alert" className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}
      {message && (
        <div role="status" className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{message}</span>
        </div>
      )}

      {/* Existing Applications Switcher */}
      {mine.length > 0 && (
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
          <label htmlFor="franchise-applications-select" className="text-xs font-semibold text-[#0A1D3F] block">
            Existing Franchise Applications in your Account
          </label>
          <select
            id="franchise-applications-select"
            aria-label="Your franchise applications"
            value={row?.id || ''}
            className="block w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-white text-[#0A1D3F] focus:outline-none focus:ring-2 focus:ring-[#0A1D3F]"
            onChange={e => {
              const item = mine.find(v => v.id === e.target.value);
              if (item) select(item);
            }}
          >
            <option value="">Select an application to view or edit</option>
            {mine.map(v => (
              <option key={v.id} value={v.id}>
                {v.reference} — {statusLabel(v.status)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Current Active Application Status Banner */}
      {row && (
        <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Application Reference
              </span>
              <span className="font-mono font-bold text-sm text-[#0A1D3F]">{row.reference}</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                  row.status === 'approved'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : row.status === 'pending'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {statusLabel(row.status)}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {statusLabel(row.affiliationState)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80 text-xs text-slate-600">
            <div>
              {row.activatedAt && <span>Activated: {new Date(row.activatedAt).toLocaleDateString()} • </span>}
              {row.renewalDueAt && <span>Renewal due: {new Date(row.renewalDueAt).toLocaleDateString()}</span>}
            </div>
            <div className="flex items-center gap-3">
              <button
                disabled={busy}
                type="button"
                onClick={() => run(refresh)}
                className="inline-flex items-center gap-1.5 text-xs text-[#0A1D3F] font-semibold hover:underline cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
                <span>Refresh status</span>
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setStep(0);
                  setRow(null);
                  setLogo(null);
                  setForm(empty());
                  setLinked(false);
                  setFiles({});
                  setPendingAssets({});
                  setReplaceDoc({});
                  setOrder(null);
                  setAccepted(false);
                  draftKey.current = crypto.randomUUID();
                  const next = new URLSearchParams(params);
                  next.delete('draft');
                  setParams(next, { replace: true });
                }}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 underline cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Start new application</span>
              </button>
            </div>
          </div>
          {row.statusHistory?.filter(h => h.reason).map((h, i) => (
            <p key={i} className="text-xs text-slate-500 bg-white p-2 rounded-lg border border-slate-200">
              <strong>{statusLabel(h.to)}:</strong> {h.reason}
            </p>
          ))}
        </div>
      )}

      {/* Policy Unavailability Notice */}
      {!approvedPolicy && (
        <div role="status" className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 leading-relaxed">
          {config
            ? userMessage(config.message) ||
              'Franchise applications are not open yet. You can begin entering your details; saving and submission will be available when applications open.'
            : 'Loading application requirements...'}
        </div>
      )}

      {/* Stepper Navigation */}
      {editable && (row || policy.acceptingApplications !== false) && (
        <nav aria-label="Franchise registration steps">
          <ol className="relative grid grid-cols-5 gap-1 mb-2 before:absolute before:top-[18px] before:h-0.5 before:w-full before:bg-[#E2E8F0]">
            {steps.map((label, index) => (
              <li key={label} className="relative min-w-0 text-center">
                <button
                  type="button"
                  disabled={busy}
                  aria-label={label}
                  aria-current={step === index ? 'step' : undefined}
                  onClick={() => setStep(index)}
                  className="w-full flex flex-col items-center gap-1.5 text-[10px] sm:text-xs cursor-pointer"
                >
                  <span
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold transition ${
                      step === index
                        ? 'bg-[#FF8A00] text-white ring-4 ring-orange-100'
                        : index < step
                        ? 'bg-[#0A1D3F] text-white'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {index < step ? <Check className="w-4 h-4" /> : index + 1}
                  </span>
                  <span
                    className={`break-words text-[11px] font-medium hidden sm:block ${
                      step === index ? 'text-[#FF8A00] font-bold' : 'text-slate-500'
                    }`}
                  >
                    {label}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Steps 1 to 4: Institutional, Affiliation, Contact & Location Fields */}
      {editable && (row || policy.acceptingApplications !== false) && (
        <form
          noValidate
          ref={detailsForm}
          aria-label="Franchise application details"
          onSubmit={e => {
            e.preventDefault();
            if (!checkSteps(false)) return;
            saveDraftWithDocuments();
          }}
        >
          <fieldset disabled={busy} className="space-y-4">
            <OriginalFranchiseFields
              form={form}
              setForm={setForm}
              step={step}
              policy={policy}
              linked={linked}
              setLinked={setLinked}
              universities={universities}
              colleges={colleges}
              logo={logo}
              onLogo={setLogo}
              onLogoError={setError}
              onPrevious={() => (step ? setStep(v => v - 1) : onBack())}
              onNext={() => {
                const controls = detailsForm.current?.querySelectorAll(
                  `[data-step="${step}"] input,[data-step="${step}"] select,[data-step="${step}"] textarea`
                );
                for (const control of controls || []) if (!control.reportValidity()) return;
                setStep(v => v + 1);
              }}
            />
          </fieldset>
        </form>
      )}

      {/* ========================================================
          STEP 5: REVIEW, DOCUMENTS, AGREEMENT & SUBMISSION
         ======================================================== */}
      {(!editable || step === 4) && (
        <div className="space-y-6 pt-2">
          {approvedPolicy ? (
            <>
              {/* Step 5 Intro Banner */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs text-[#0A1D3F]">
            <div>
              <span className="font-bold text-sm block">Step 5: Review & Supporting Documents</span>
              <span className="text-slate-500">
                Attach your required documents and accept the franchise agreement to submit.
              </span>
            </div>
            <div className="text-right text-[11px] font-semibold text-slate-600">
              Joining: <span className="text-[#0A1D3F] font-bold">{policy.joining.amountMinor === 0 ? 'Free' : '₹' + (policy.joining.amountMinor / 100).toFixed(2)}</span> • Renewal:{' '}
              <span className="text-[#0A1D3F] font-bold">
                {policy.renewal.enabled ? `Every ${policy.renewal.months} mo (₹${(policy.renewal.amountMinor / 100).toFixed(2)})` : 'None'}
              </span>
            </div>
          </div>

          {/* Account Verification Section */}
          <RegistrationAccount applicantName={form.contact.person} applicantEmail={form.contact.email} />

          {/* Supporting Documents Section */}
          <section className="space-y-3.5" aria-label="Supporting documents">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#0A1D3F] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#FF8A00]" />
                  <span>Required Supporting Documents</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Select and attach your institutional credentials. Files can be attached directly at any time.
                </p>
              </div>
            </div>

            {!policy.documents?.length && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center">
                No supporting documents required by this policy.
              </div>
            )}

            <div className="space-y-3">
              {policy.documents.map(d => {
                const doc = row?.documents?.find(v => v.key === d.key);
                const isReplacing = replaceDoc[d.key];
                const selectedFile = files[d.key];
                const isPendingScan = Boolean(pendingAssets[d.key]);

                return (
                  <div
                    key={d.key}
                    className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3 transition hover:border-slate-300"
                  >
                    {/* Document Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-[#0A1D3F]">{d.label}</span>
                        {d.required ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Required
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                            Optional
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Up to {(d.maxBytes / 1048576).toFixed(0)} MB ({d.mime.map(m => m.replace('application/', '').replace('image/', '.')).join(', ')})
                      </span>
                    </div>

                    {/* Already Attached Document Display */}
                    {doc && !isReplacing && (
                      <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <span className="font-semibold text-emerald-900 block">Uploaded & Attached</span>
                            <span className="text-[11px] text-emerald-700">
                              Verification status: <strong>{doc.state}</strong>
                              {doc.reason ? ` — ${doc.reason}` : ''}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <a
                            href={'/api/v1/media/' + doc.assetId + '/content'}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                          >
                            <span>View uploaded file</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          {editable && (
                            <button
                              type="button"
                              onClick={() => setReplaceDoc(v => ({ ...v, [d.key]: true }))}
                              className="text-xs text-slate-600 hover:text-[#0A1D3F] font-semibold underline cursor-pointer"
                            >
                              Replace file
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Direct Upload Controls (Enabled without requiring manual draft save first) */}
                    {editable && (!doc || isReplacing) && (
                      <div className="space-y-2 pt-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 hover:border-[#FF8A00] bg-white hover:bg-orange-50/40 text-[#0A1D3F] text-xs font-semibold cursor-pointer shadow-2xs transition">
                            <UploadCloud className="w-4 h-4 text-[#FF8A00]" />
                            <span>{selectedFile ? 'Change File' : 'Choose File'}</span>
                            <input
                              aria-label={'Select ' + d.label}
                              disabled={!canSave || busy}
                              type="file"
                              className="hidden"
                              accept={d.mime.join(',')}
                              onChange={e => {
                                const picked = e.target.files?.[0] || null;
                                setFiles(v => ({ ...v, [d.key]: picked }));
                              }}
                            />
                          </label>

                          {selectedFile ? (
                            <div className="flex items-center gap-2 text-xs text-[#0A1D3F] bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                              <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span className="font-semibold truncate max-w-[200px] sm:max-w-[260px]">
                                {selectedFile.name}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                ({(selectedFile.size / 1024).toFixed(1)} KB)
                              </span>
                              <button
                                type="button"
                                onClick={() => setFiles(v => ({ ...v, [d.key]: null }))}
                                className="text-slate-400 hover:text-red-600 p-0.5 ml-1 transition cursor-pointer"
                                title="Remove selected file"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">No file selected yet</span>
                          )}

                          {(selectedFile || isPendingScan) && (
                            <button
                              type="button"
                              disabled={!canSave || busy}
                              onClick={() => upload(d)}
                              className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0A1D3F] hover:bg-[#133C8B] text-white text-xs font-semibold shadow-xs transition disabled:opacity-50 cursor-pointer"
                            >
                              <UploadCloud className="w-3.5 h-3.5" />
                              <span>{isPendingScan ? 'Check scan & attach' : 'Upload now'}</span>
                            </button>
                          )}

                          {isReplacing && (
                            <button
                              type="button"
                              onClick={() => {
                                setReplaceDoc(v => ({ ...v, [d.key]: false }));
                                setFiles(v => ({ ...v, [d.key]: null }));
                              }}
                              className="text-xs text-slate-500 hover:text-slate-700 underline cursor-pointer ml-auto"
                            >
                              Cancel replace
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Privacy Notice and Franchise Agreement Accordion */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => setTermsOpen(v => !v)}
              className="w-full flex items-center justify-between p-4 text-left font-bold text-xs sm:text-sm text-[#0A1D3F] hover:bg-slate-50 transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#FF8A00]" />
                <span>Franchise Agreement Terms & Privacy Notice ({policy.agreement.version})</span>
              </div>
              {termsOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            {termsOpen && (
              <div className="p-4 pt-0 border-t border-slate-100 space-y-3 text-xs text-slate-600 bg-slate-50/50">
                <div>
                  <h4 className="font-semibold text-[#0A1D3F] mb-1">Privacy Notice</h4>
                  <p className="whitespace-pre-wrap leading-relaxed bg-white p-3 rounded-xl border border-slate-200 text-[11px] max-h-32 overflow-y-auto">
                    {policy.privacyText}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-[#0A1D3F] mb-1">Agreement Terms ({policy.agreement.version})</h4>
                  <p className="whitespace-pre-wrap leading-relaxed bg-white p-3 rounded-xl border border-slate-200 text-[11px] max-h-40 overflow-y-auto font-mono">
                    {policy.agreement.text}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Agreement Checkbox */}
          {editable && (
            <label className="flex items-start gap-3 p-4 bg-amber-50/50 border border-amber-200 rounded-2xl cursor-pointer hover:bg-amber-50/80 transition text-xs text-[#0A1D3F] select-none">
              <input
                aria-label="Accept franchise agreement"
                type="checkbox"
                checked={accepted}
                onChange={e => setAccepted(e.target.checked)}
                className="mt-0.5 rounded text-[#FF8A00] focus:ring-[#FF8A00] cursor-pointer"
              />
              <span className="leading-relaxed">
                I have read and accept agreement <strong>{policy.agreement.version}</strong> and the privacy notice. I confirm that the details and documents supplied are accurate, and I understand that KITSS will list the institution name, type, city, website, and programs after approval.
              </span>
            </label>
          )}

          {/* Live Progress Feedback while performing actions */}
          {busy && (
            <div className="p-4 bg-orange-50/90 border border-orange-200 rounded-2xl flex items-center gap-3.5 shadow-xs text-xs text-[#0A1D3F] animate-pulse">
              <Loader2 className="w-5 h-5 text-[#FF8A00] animate-spin shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#0A1D3F] truncate">
                  {actionStage || (submitting ? 'Submitting franchise application...' : savingDraft ? 'Saving application draft...' : 'Processing request...')}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Please wait while your data and documents are securely processed and verified.
                </p>
              </div>
            </div>
          )}
            </>
          ) : (
            <p className="text-sm text-slate-600">Document requirements will appear when applications open.</p>
          )}

          {/* Bottom Action Bar */}
          {editable && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="w-full sm:w-auto py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:text-[#0A1D3F] hover:bg-slate-50 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous step</span>
              </button>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={!canSave || busy}
                  onClick={saveDraftWithDocuments}
                  className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-[#0A1D3F] text-xs font-semibold shadow-2xs transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {savingDraft ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                      <span>Saving draft...</span>
                    </>
                  ) : (
                    <span>Save application draft</span>
                  )}
                </button>
                <button
                  type="button"
                  disabled={!canSave || busy || !accepted}
                  onClick={() => {
                    if (checkSteps(true)) submit();
                  }}
                  className="flex-1 sm:flex-none py-2.5 px-5 rounded-xl bg-[#FF8A00] hover:bg-[#E67C00] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <span className="truncate">{actionStage || 'Submitting application...'}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Submit franchise application</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Celebratory Post-Submission Summary at Bottom */}
          {!editable && row && row.status === 'pending' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-4 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-2xs">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#0A1D3F]">Franchise Application Submitted!</h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  Your franchise application has been received and is currently <span className="font-semibold text-emerald-800">under KITSS review</span>.
                </p>
                <p className="text-xs text-slate-500 font-mono">
                  Reference: <span className="font-bold text-slate-800">{row.reference}</span>
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run(refresh)}
                  className="py-2.5 px-4 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-800 font-semibold text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
                  <span>Refresh Status</span>
                </button>
                <Link
                  to="/my-applications"
                  className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Go to My Applications</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* Under Review Card at Bottom */}
          {!editable && row && row.status === 'under_review' && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center space-y-4 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mx-auto">
                <Clock className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#0A1D3F]">Application Under Review</h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  KITSS administrators are actively verifying your institution details and credentials.
                </p>
                <p className="text-xs text-slate-500 font-mono">
                  Reference: <span className="font-bold text-slate-800">{row.reference}</span>
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run(refresh)}
                  className="py-2.5 px-4 rounded-xl border border-blue-300 bg-white hover:bg-blue-50 text-blue-800 font-semibold text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
                  <span>Refresh Status</span>
                </button>
                <Link
                  to="/my-applications"
                  className="py-2.5 px-5 rounded-xl bg-[#0A1D3F] hover:bg-[#07152d] text-white font-bold text-xs shadow-xs transition inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Go to My Applications</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* Approved Affiliation Activation Callout */}
          {approvedPolicy && row?.status === 'approved' && !row.activatedAt && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#0A1D3F]">Franchise Approved!</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Your application has been verified and approved by KITSS administrators. You can now activate your institutional affiliation.
              </p>
              <button
                disabled={busy || (policy.joining.amountMinor > 0 && !payment?.available)}
                onClick={() =>
                  policy.joining.amountMinor > 0
                    ? pay(false)
                    : run(async () => {
                        const ticket = identity.current;
                        const value = await authenticatedWrite(path + '/' + row.id + '/activate', {
                          expectedRevision: row.revision
                        });
                        sameAccount(ticket);
                        setRow(value);
                      })
                }
                className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                {policy.joining.amountMinor > 0 ? 'Pay joining fee (Test Mode)' : 'Activate free affiliation'}
              </button>
            </div>
          )}

          {/* Renewal Section */}
          {row?.activatedAt && row.renewalDueAt && config?.policy && (
            <section className="border border-slate-200 rounded-2xl p-4 sm:p-5 bg-white space-y-3">
              <h3 className="font-bold text-sm text-[#0A1D3F]">Renew Franchise Affiliation</h3>
              <p className="text-xs text-slate-600">
                Renewals open {policy.reminderDays} days before the due date. Current renewal terms: ₹
                {(config.policy.renewal.amountMinor / 100).toFixed(2)}
                {config.policy.renewal.enabled
                  ? ` every ${config.policy.renewal.months} months`
                  : '; no further renewals required'}
                .
              </p>
              <details className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <summary className="font-semibold cursor-pointer">
                  Current renewal agreement {config.policy.agreement.version}
                </summary>
                <p className="whitespace-pre-wrap mt-2">{config.policy.agreement.text}</p>
              </details>
              <label className="flex items-center gap-2 text-xs text-[#0A1D3F] cursor-pointer">
                <input
                  type="checkbox"
                  checked={renewAccepted}
                  onChange={e => setRenewAccepted(e.target.checked)}
                  className="rounded text-[#FF8A00] focus:ring-[#FF8A00]"
                />
                <span>I accept the current renewal terms and policy.</span>
              </label>
              <button
                disabled={busy || !renewAccepted || (config.policy.renewal.amountMinor > 0 && !payment?.available)}
                onClick={() =>
                  config.policy.renewal.amountMinor > 0
                    ? pay(true)
                    : run(async () => {
                        const ticket = identity.current;
                        const value = await authenticatedWrite(path + '/' + row.id + '/renew', {
                          expectedRevision: row.revision,
                          agreementVersion: config.policy.agreement.version,
                          accepted: renewAccepted
                        });
                        sameAccount(ticket);
                        setRow(value);
                        setMessage('Franchise renewal completed.');
                      })
                }
                className="py-2 px-4 rounded-xl bg-[#0A1D3F] hover:bg-[#133C8B] text-white text-xs font-semibold transition cursor-pointer"
              >
                {config.policy.renewal.amountMinor > 0 ? 'Pay renewal fee (Test Mode)' : 'Renew without payment'}
              </button>
            </section>
          )}

          {/* Payment & Order Status */}
          {order && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
              <p className="font-semibold text-[#0A1D3F]">
                Order {order.reference}: {order.paymentStatus}; Fulfillment: {order.activationStatus}
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      setOrder(await commerceService.status(order.id));
                      await refresh();
                    })
                  }
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Refresh payment status
                </button>
                <Link to="/orders" className="text-slate-600 hover:underline">
                  View payment history
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
