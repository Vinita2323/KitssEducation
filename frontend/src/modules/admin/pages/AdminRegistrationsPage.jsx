import { TeacherListingControls } from '../components/TeacherListingControls';
import { Link } from 'react-router-dom';
import { AdminField, AdminInput, AdminTextarea } from '../components/AdminFields';
import { useDialogFocus } from '../../../shared/ui/useDialogFocus';
import React, { useEffect, useState, useMemo } from 'react';
import { httpClient } from '../../../shared/api/httpClient';
import { authenticatedWrite } from '../../user/services/authService';
import { useAuth } from '../../user/context/AuthContext';
import {
  ChevronRight,
  ClipboardList,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  Building2,
  FileText,
  MessageSquare,
  History,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  ExternalLink,
  ChevronDown,
  Info
} from 'lucide-react';
import { AdminEmpty, AdminPageHeader, AdminStatus } from '../components/AdminUI';

const fieldDisplayLabels = {
  studentName: "Student Name",
  fullName: "Full Name",
  title: "Title / Salutation",
  fatherName: "Father's Name",
  motherName: "Mother's Name",
  dob: "Date of Birth",
  age: "Age",
  contactNo: "Contact Number",
  callingNo: "Calling Number",
  contactNumber: "Contact Number",
  whatsappNo: "WhatsApp Number",
  whatsappNumber: "WhatsApp Number",
  guardianContactNo: "Guardian Contact",
  email: "Email Address",
  emailId: "Email Address",
  studentClass: "Class / Grade",
  studyBoard: "Education Board",
  studyLanguage: "Instruction Language",
  address: "Address",
  homeAddress: "Home Address",
  city: "City",
  district: "District",
  state: "State",
  stateName: "State",
  pincode: "PIN Code",
  schoolName: "School Name",
  schoolAddress: "School Address",
  instituteName: "Institute Name",
  instituteAddress: "Institute Address",
  instituteContact: "Institute Contact",
  applyCourseName: "Course Applying For",
  applyInstituteName: "Institute Applying For",
  coachingCourse: "Coaching Course / Subject",
  coachingExperience: "Teaching Experience",
  specializationNotes: "Specialization & Notes",
  startDate: "Start Date",
  endDate: "End Date",
  isContinuing: "Currently Active / Continuing",
};

const statusDisplayLabels = {
  draft: "Draft (In Progress)",
  submitted: "Submitted",
  pending_verification: "Pending Verification",
  under_review: "Under Review",
  needs_changes: "Needs Changes",
  approved: "Approved",
  rejected: "Rejected",
  activated: "Activated",
};

const allowedTransitions = {
  submitted: ['pending_verification', 'under_review', 'needs_changes', 'rejected'],
  pending_verification: ['under_review', 'needs_changes', 'rejected'],
  under_review: ['approved', 'needs_changes', 'rejected'],
  approved: ['activated', 'needs_changes', 'rejected'],
  needs_changes: [],
  rejected: [],
  activated: []
};

export function AdminRegistrationsPage() {
  const { can } = useAuth();
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const [modalError, setModalError] = useState('');
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [reviewReason, setReviewReason] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'submitted', 'drafts', 'teacher'
  const [showCompliance, setShowCompliance] = useState(false);

  useEffect(() => {
    const c = new AbortController();
    httpClient.request('/admin/registration-applications?page=' + page, { signal: c.signal })
      .then(r => {
        setRows(r.data.items);
        setTotal(r.data.total);
      })
      .catch(e => {
        if (e.code !== 'ABORTED') setError(e.message);
      });
    return () => c.abort();
  }, [page]);

  const addNote = async () => {
    if (!note.trim()) return;
    setBusy(true);
    setModalError('');
    try {
      const row = await authenticatedWrite('/admin/registration-applications/' + selected.id + '/notes', {
        text: note,
        idempotencyKey: crypto.randomUUID()
      });
      setSelected(row);
      setRows(old => old.map(r => r.id === row.id ? row : r));
      setNote('');
    } catch (e) {
      setModalError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const change = async fields => {
    setBusy(true);
    setModalError('');
    try {
      const row = await authenticatedWrite(
        '/admin/registration-applications/' + selected.id + '/status',
        { ...fields, reason: reviewReason, expectedRevision: selected.revision },
        'PATCH'
      );
      setSelected(row);
      setRows(old => old.map(r => r.id === row.id ? row : r));
      setReviewReason('');
    } catch (e) {
      setModalError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const reviewDialog = useDialogFocus(Boolean(selected), () => {
    setSelected(null);
    setModalError('');
  });

  const filteredRows = useMemo(() => {
    if (activeTab === 'submitted') return rows.filter(r => r.status !== 'draft');
    if (activeTab === 'drafts') return rows.filter(r => r.status === 'draft');
    if (activeTab === 'teacher') return rows.filter(r => r.kind === 'teacher');
    return rows;
  }, [rows, activeTab]);

  const counts = useMemo(() => {
    return {
      all: rows.length,
      submitted: rows.filter(r => r.status !== 'draft').length,
      drafts: rows.filter(r => r.status === 'draft').length,
      teacher: rows.filter(r => r.kind === 'teacher').length,
    };
  }, [rows]);

  // Clean applicant entries: hide blank values and format keys
  const validApplicantEntries = useMemo(() => {
    if (!selected?.applicant) return [];
    return Object.entries(selected.applicant).filter(([, v]) => {
      if (v === null || v === undefined) return false;
      if (typeof v === 'string' && !v.trim()) return false;
      return true;
    });
  }, [selected]);

  const isDraft = selected?.status === 'draft';
  const availableTransitions = isDraft ? [] : (allowedTransitions[selected?.status] || []);

  return (
    <section className="space-y-5 text-[#0A1D3F]">
      <AdminPageHeader
        title="Registration Review"
        description="Review student study and tuition requests, and teacher and coaching applications. Activation requires approval, verified documents (and verified guardian consent when applicable); publishing public teacher profiles is managed below."
      />

      {error && (
        <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* Main Tabs / Filter Segments */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { key: 'all', label: 'All Registrations', count: counts.all },
          { key: 'submitted', label: 'Submitted (Ready for Review)', count: counts.submitted },
          { key: 'drafts', label: 'Incomplete Drafts', count: counts.drafts },
          { key: 'teacher', label: 'Teacher Applications', count: counts.teacher },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === tab.key
                ? 'bg-[#0A1D3F] text-white shadow-xs'
                : 'bg-white border border-[#E6E8EC] text-[#53647c] hover:bg-gray-50'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-[#53647c]'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Registrations List */}
      <div className="admin-list space-y-2.5">
        {filteredRows.map(row => {
          const kindLabel = {
            tuition: "Tuition / Coaching",
            study: "Study Enquiry",
            teacher: "Teacher Application",
            "coaching-profile": "Coaching Profile"
          }[row.kind] || row.kind;

          return (
            <button
              key={row.id}
              aria-current={selected?.id === row.id ? 'true' : undefined}
              onClick={() => {
                setSelected(row);
                setModalError('');
                setReviewReason('');
                setNote('');
              }}
              className="admin-list-item flex items-center justify-between p-3.5 sm:p-4 bg-white border border-[#E6E8EC] hover:border-[#FF8A00] rounded-2xl shadow-2xs transition group text-left cursor-pointer"
            >
              <div className="space-y-1 min-w-0 flex-1 pr-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-[#FF8A00]">
                    {row.reference}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#F4F6FB] text-[#0A1D3F] border border-[#E1E7F0]">
                    {kindLabel}
                  </span>
                  <AdminStatus value={row.status}>
                    {statusDisplayLabels[row.status] || row.status}
                  </AdminStatus>
                </div>

                <div className="flex items-center gap-3 text-xs text-[#53647c] flex-wrap pt-0.5">
                  {row.applicant?.studentName || row.applicant?.fullName ? (
                    <span className="font-semibold text-[#0A1D3F]">
                      {row.applicant?.studentName || row.applicant?.fullName}
                    </span>
                  ) : null}
                  {(row.applicant?.emailId || row.applicant?.email) && (
                    <span className="truncate max-w-[200px]">
                      {row.applicant?.emailId || row.applicant?.email}
                    </span>
                  )}
                  <span className="text-[11px] text-gray-400">
                    Payment: <strong className="capitalize text-[#0A1D3F]">{row.paymentState || 'Not required'}</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs font-semibold text-[#FF8A00] group-hover:translate-x-0.5 transition shrink-0">
                <span>Review</span>
                <ChevronRight aria-hidden="true" size={16} />
              </div>
            </button>
          );
        })}
      </div>

      {!filteredRows.length && (
        <AdminEmpty icon={ClipboardList}>
          <p className="text-xs text-[#53647c]">No registrations matching the selected filter.</p>
        </AdminEmpty>
      )}

      {/* Pagination Controls */}
      <div className="admin-pager flex items-center justify-between text-xs pt-1">
        <button
          className="admin-btn admin-btn-secondary admin-btn-sm cursor-pointer"
          disabled={page === 1}
          onClick={() => setPage(p => p - 1)}
        >
          Previous
        </button>
        <span className="admin-meta text-[#53647c]">
          Page {page} of {Math.max(1, Math.ceil(total / 20))} ({total} total)
        </span>
        <button
          className="admin-btn admin-btn-secondary admin-btn-sm cursor-pointer"
          disabled={page * 20 >= total}
          onClick={() => setPage(p => p + 1)}
        >
          Next
        </button>
      </div>

      {/* REVIEW DETAIL MODAL */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-[#0A1D3F]/75 p-3 sm:p-4 flex items-center justify-center overflow-y-auto animate-in fade-in duration-150 backdrop-blur-2xs">
          <div
            ref={reviewDialog}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            aria-label={'Registration ' + selected.reference}
            className="w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-[#E6E8EC]"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#E6E8EC] bg-white sticky top-0 z-10 shrink-0">
              <div className="space-y-1 min-w-0 pr-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold text-[#0A1D3F] font-mono">
                    {selected.reference}
                  </h2>
                  <AdminStatus value={selected.status}>
                    {statusDisplayLabels[selected.status] || selected.status}
                  </AdminStatus>
                </div>
                <p className="text-xs text-[#53647c]">
                  Type: <strong className="capitalize text-[#0A1D3F]">{selected.kind}</strong> • Payment: <strong className="capitalize text-[#0A1D3F]">{selected.paymentState || 'None'}</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelected(null);
                  setModalError('');
                }}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                aria-label="Close registration review"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
              {/* Dynamic In-Modal Error Alert */}
              {modalError && (
                <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                  <div>
                    <strong className="block">Action could not be completed:</strong>
                    <span>{modalError}</span>
                  </div>
                </div>
              )}

              {/* Informative Draft Notice Banner */}
              {isDraft && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <Info className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Incomplete Draft Application</span>
                  </div>
                  <p className="leading-relaxed">
                    This registration is an in-progress draft saved by the student. Official review decisions (Approve, Move to Review, Activate) unlock once the applicant completes and submits the application. You can still add internal counselor notes below.
                  </p>
                </div>
              )}

              {/* SECTION 1: APPLICANT DETAILS */}
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A1D3F] uppercase tracking-wider">
                  <User className="w-3.5 h-3.5 text-[#FF8A00]" />
                  <span>Applicant Information</span>
                </div>

                {validApplicantEntries.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    {validApplicantEntries.map(([k, v]) => (
                      <div key={k} className="p-2 bg-white rounded-xl border border-gray-100 space-y-0.5">
                        <span className="text-[10px] text-[#64748B] font-semibold uppercase tracking-wider block">
                          {fieldDisplayLabels[k] || k}
                        </span>
                        <span className="text-[#0A1D3F] font-bold break-words block">
                          {typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#64748B] italic">
                    No detailed profile fields entered yet.
                  </p>
                )}
              </div>

              {/* SECTION 2: REQUIRED DOCUMENTS & EVIDENCE */}
              <div className="bg-white border border-[#E6E8EC] rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A1D3F] uppercase tracking-wider">
                    <FileText className="w-3.5 h-3.5 text-[#FF8A00]" />
                    <span>Required Documents</span>
                  </div>
                  <span className="text-[11px] text-[#64748B]">
                    {selected.documents?.length || 0} Attached
                  </span>
                </div>

                {selected.requiredDocuments?.length > 0 ? (
                  <div className="text-xs text-[#64748B]">
                    <span>Outstanding required documents: </span>
                    <strong className="text-[#0A1D3F]">
                      {selected.requiredDocuments.join(', ')}
                    </strong>
                  </div>
                ) : (
                  <p className="text-xs text-[#64748B]">No mandatory documents required for this category.</p>
                )}

                {/* Attached Documents */}
                {selected.documents?.map(d => (
                  <div key={d.key} className="p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#0A1D3F] capitalize">
                          {d.key.replace(/([A-Z])/g, ' $1')}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            d.status === 'verified'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : d.status === 'rejected'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {d.status}
                        </span>
                      </div>

                      {can('registrations.documents.review') && (
                        <a
                          className="inline-flex items-center gap-1 text-xs text-blue-600 font-semibold hover:underline"
                          href={'/api/v1/media/' + d.assetId + '/content'}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <span>Review Document</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {d.reason && (
                      <p className="text-xs text-gray-500 italic">Note: {d.reason}</p>
                    )}

                    {can('registrations.documents.review') && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          disabled={busy || !reviewReason.trim()}
                          onClick={() => change({ documentKey: d.key, documentStatus: 'verified' })}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 transition cursor-pointer"
                        >
                          Verify {d.key}
                        </button>
                        <button
                          disabled={busy || !reviewReason.trim()}
                          onClick={() => change({ documentKey: d.key, documentStatus: 'rejected' })}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 disabled:opacity-40 transition cursor-pointer"
                        >
                          Reject {d.key}
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {/* Guardian Consent */}
                {selected.guardianConsent?.acceptedAt && can('registrations.documents.review') && (
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-[#0A1D3F] font-semibold">
                      Guardian Consent: {selected.guardianConsent.verifiedAt ? 'Verified' : 'Pending Verification'}
                    </span>
                    {!selected.guardianConsent.verifiedAt && (
                      <button
                        disabled={busy || !reviewReason.trim()}
                        onClick={() => change({ guardianVerified: true })}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#0A1D3F] hover:bg-[#133C8B] disabled:opacity-40 transition cursor-pointer"
                      >
                        Verify Guardian Evidence
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* SECTION 3: DECISION ACTIONS */}
              <div className="bg-white border border-[#E6E8EC] rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A1D3F] uppercase tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#FF8A00]" />
                    <span>Review Decision</span>
                  </div>
                  <span className="text-[11px] text-[#64748B]">
                    Current Status: <strong className="text-[#0A1D3F]">{statusDisplayLabels[selected.status] || selected.status}</strong>
                  </span>
                </div>

                <AdminField className="block">
                  <span className="text-xs font-semibold text-[#0A1D3F] block mb-1">
                    Decision Reason <span className="text-red-500">*</span>
                  </span>
                  <AdminTextarea
                    aria-label="Registration decision reason"
                    className="w-full border border-[#E6E8EC] rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#FF8A00] bg-[#F7F8FA]"
                    value={reviewReason}
                    onChange={e => setReviewReason(e.target.value)}
                    placeholder="Enter decision reason (required to change status or verify documents)..."
                    maxLength={1000}
                    rows={2}
                  />
                  <span className="text-[10px] text-[#64748B] mt-0.5 block">
                    Type a reason above to enable approval, review, and status update actions.
                  </span>
                </AdminField>

                {!isDraft && availableTransitions.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] text-[#64748B] font-semibold uppercase block">
                      Available Status Actions:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {availableTransitions.map(st => {
                        const isApprove = ['approved', 'activated'].includes(st);
                        const isReject = st === 'rejected';
                        const label = {
                          pending_verification: "Pending Verification",
                          under_review: "Move to Under Review",
                          needs_changes: "Request Changes",
                          approved: "Approve Application",
                          rejected: "Reject Application",
                          activated: "Activate Registration"
                        }[st] || st;

                        return (
                          <button
                            key={st}
                            disabled={busy || !reviewReason.trim() || !can(isApprove ? 'registrations.approve' : 'registrations.review')}
                            onClick={() => change({ status: st })}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                              isApprove
                                ? 'bg-[#0A1D3F] hover:bg-[#133C8B] text-white'
                                : isReject
                                ? 'bg-red-50 border border-red-200 text-red-700 hover:bg-red-100'
                                : 'bg-gray-100 hover:bg-gray-200 text-[#0A1D3F]'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 4: CONTEXTUAL LINKS */}
              {selected.kind === 'study' && (
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl text-xs text-blue-900 space-y-1">
                  <strong>Student Study Guidance:</strong>
                  <p className="text-blue-800">
                    KITSS handles study arrangements directly. Use counselor notes below to record phone consultations and next steps.
                  </p>
                </div>
              )}

              {selected.kind === 'tuition' && (
                <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
                  <div>
                    <strong className="text-[#0A1D3F] block">Coaching & Tuition Setup</strong>
                    <span className="text-[#64748B]">Enroll students into coaching batches directly.</span>
                  </div>
                  <Link
                    to="/admin/coaching"
                    className="px-3 py-1.5 rounded-xl font-bold text-xs bg-[#0A1D3F] text-white hover:bg-[#133C8B] transition shrink-0"
                  >
                    Manage Coaching
                  </Link>
                </div>
              )}

              {/* Teacher Listing Controls (if teacher) */}
              <TeacherListingControls
                key={selected.id}
                application={selected}
                onChange={row => {
                  setSelected(row);
                  setRows(old => old.map(item => item.id === row.id ? row : item));
                }}
              />

              {/* SECTION 5: COUNSELOR NOTES */}
              <div className="bg-white border border-[#E6E8EC] rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A1D3F] uppercase tracking-wider">
                  <MessageSquare className="w-3.5 h-3.5 text-[#FF8A00]" />
                  <span>Internal Counselor Notes</span>
                </div>

                {selected.notes && selected.notes.length > 0 ? (
                  <div className="space-y-2">
                    {selected.notes.map(n => (
                      <div key={n.id} className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-[#64748B]">
                          <span className="font-semibold text-[#0A1D3F]">Counselor Note</span>
                          <span>{n.at ? new Date(n.at).toLocaleString('en-IN') : ''}</span>
                        </div>
                        <p className="text-[#0A1D3F] leading-relaxed">{n.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#64748B] italic">No internal counselor notes added yet.</p>
                )}

                <div className="space-y-2 pt-1">
                  <AdminTextarea
                    aria-label="Registration review note"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Type an internal note regarding phone calls, student preferences, or document follow-ups..."
                    className="w-full border border-[#E6E8EC] rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#FF8A00] bg-[#F7F8FA]"
                    rows={2}
                  />
                  <div className="flex justify-end">
                    <button
                      disabled={!can('registrations.write') || !note.trim() || busy}
                      onClick={addNote}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#0A1D3F] hover:bg-[#133C8B] disabled:opacity-40 transition cursor-pointer"
                    >
                      Add Review Note
                    </button>
                  </div>
                </div>
              </div>

              {/* SECTION 6: AUDIT TIMELINE & HISTORY */}
              {selected.history && selected.history.length > 0 && (
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A1D3F] uppercase tracking-wider">
                    <History className="w-3.5 h-3.5 text-[#FF8A00]" />
                    <span>Review History & Audit Trail</span>
                  </div>

                  <div className="space-y-2">
                    {selected.history.map((h, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs p-2 bg-white rounded-xl border border-gray-100">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-[#0A1D3F] shrink-0">
                          {statusDisplayLabels[h.status] || h.status}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#0A1D3F] leading-snug">{h.reason}</p>
                          <span className="text-[10px] text-[#64748B]">
                            {h.actorId} • {h.at ? new Date(h.at).toLocaleString('en-IN') : ''}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 7: COMPLIANCE & DATA RETENTION (COLLAPSIBLE) */}
              {can('registrations.documents.review') && (
                <div className="border border-gray-200 rounded-2xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowCompliance(!showCompliance)}
                    className="w-full flex items-center justify-between p-3.5 bg-gray-50 text-xs font-bold text-[#53647c] hover:bg-gray-100 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-gray-500" />
                      <span>Data Privacy & Legal Compliance Options</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showCompliance ? 'rotate-180' : ''}`} />
                  </button>

                  {showCompliance && (
                    <div className="p-4 space-y-3 bg-white text-xs border-t border-gray-200">
                      <AdminField className="flex items-center gap-2 font-medium">
                        <AdminInput
                          type="checkbox"
                          checked={selected.legalHold ?? false}
                          disabled={busy || !reviewReason.trim()}
                          onChange={e => change({ legalHold: e.target.checked })}
                        />
                        <span>Legal Hold (Prevents automated data deletion under retention policy)</span>
                      </AdminField>

                      <div className="pt-2 border-t border-gray-100">
                        <button
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 disabled:opacity-40 transition cursor-pointer"
                          disabled={busy || !reviewReason.trim()}
                          onClick={async () => {
                            setBusy(true);
                            setModalError('');
                            try {
                              setSelected(await authenticatedWrite(
                                '/admin/registration-applications/' + selected.id + '/purge',
                                { expectedRevision: selected.revision, reason: reviewReason }
                              ));
                            } catch (e) {
                              setModalError(e.message);
                            } finally {
                              setBusy(false);
                            }
                          }}
                        >
                          Delete Personal Data under Approved Retention Policy
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#E6E8EC] bg-white flex justify-end gap-2 shrink-0">
              <button
                type="button"
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#53647c] bg-gray-100 hover:bg-gray-200 transition cursor-pointer"
                onClick={() => {
                  setSelected(null);
                  setModalError('');
                }}
              >
                Close Review
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
