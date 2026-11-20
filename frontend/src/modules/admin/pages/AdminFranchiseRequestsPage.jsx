import { FranchiseListingControls } from '../components/FranchiseListingControls';
import { Link } from 'react-router-dom';
import { authenticatedWrite } from '../../user/services/authService';
import { AdminField, AdminInput, AdminTextarea } from '../components/AdminFields';
import { FranchiseFeeStatus } from '../../user/components/common/FranchiseFeeStatus';
import { useDialogFocus } from '../../../shared/ui/useDialogFocus';
import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Building2,
  GraduationCap,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Mail,
  Phone,
  User,
  X,
  Send,
  AlertCircle,
  ExternalLink,
  Lock,
  ChevronRight,
  FileText,
  Globe,
  Calendar,
  Loader2
} from "lucide-react";
import { Pagination } from '../../user/components/common/Pagination';
import { useAuth } from '../../user/context/AuthContext';
import { adminService } from "../services/adminService";
import { useToast } from "../../user/context/ToastContext";
import { PrimaryButton, SecondaryButton } from "../../user/components/common/PrimaryButton";

export const AdminFranchiseRequestsPage = () => {
  const { can } = useAuth();
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);
  const [loadError, setLoadError] = useState('');
  const { showSuccess, showError } = useToast();
  const [franchises, setFranchises] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");

  // Detail Modal
  const [selectedFranchise, setSelectedFranchise] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [noteKey, setNoteKey] = useState(() => crypto.randomUUID());
  const [processing, setProcessing] = useState(false);

  const fetchFranchises = async () => {
    try {
      setLoading(true);
      const result = await adminService.page('franchise-applications', { page,
        status: statusFilter,
        search,
       });
      const data = result.data; setMeta(result.meta); setLoadError('');
      setFranchises(data || []);
    } catch (err) {
      setLoadError(err.message); setFranchises([]); showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFranchises();
  }, [statusFilter, search, page]);

  useEffect(() => { setPage(1); }, [statusFilter, search]);
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchFranchises();
  };

  const handleOpenDetail = async (fran) => {
    try { fran = await adminService.getFranchise(fran.id); } catch (error) { showError(error.message); return; }
    setSelectedFranchise(fran);
    setRejectionReason(fran.rejectionReason || "");
    setAdminNote(""); setNoteKey(crypto.randomUUID());
  };

  const handleStatusChange = async (targetStatus, reason = "") => {
    if (!selectedFranchise) return;
    const franId = selectedFranchise._id || selectedFranchise.id;

    if (targetStatus === "Rejected" && !reason.trim() && !rejectionReason.trim()) {
      showError("Please specify a reason for rejection");
      return;
    }

    try {
      setProcessing(true);
      const updated = await adminService.updateFranchiseStatus(
        franId,
        targetStatus,
        targetStatus === "Rejected" ? reason || rejectionReason : "",
        adminNote.trim() ? adminNote.trim() : null,
        selectedFranchise.revision
      );

      setSelectedFranchise(updated);
      showSuccess(`Franchise registration marked as ${targetStatus}`);
      fetchFranchises();
    } catch (err) {
      showError(err.message || "Failed to update status");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Draft":
        return <span className="inline-flex px-2.5 py-0.5 rounded-full bg-gray-50 border text-gray-700 text-xs font-bold">Draft — not submitted</span>;
      case "Approved":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Approved</span>
          </span>
        );
      case "Rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
            <XCircle className="w-3.5 h-3.5 text-red-600" />
            <span>Rejected</span>
          </span>
        );
      case "Needs changes":
        return <span className="inline-flex px-2.5 py-0.5 rounded-full bg-amber-50 border text-amber-700 text-xs font-bold">Needs changes</span>;
      case "Pending":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Pending Review</span>
          </span>
        );
    }
  };
  const editorDialog = useDialogFocus(Boolean(selectedFranchise), () => setSelectedFranchise(null));
  return (
    <div className="space-y-6"><FranchiseFeeStatus />
      {loadError && <p role="alert" className="p-3 bg-red-50 text-red-700 rounded-xl">{loadError}</p>}
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-[#E6E8EC] p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FF8A00]/10 text-[#FF8A00] flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0A1D3F]">
              Franchise Requests & Approvals
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            Review institution eligibility, supporting documents and affiliation requests. Existing university → college links are shown when supplied.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-[#667085]">
          <span className="p-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            Total Requests: <strong className="text-[#0A1D3F]">{meta?.total ?? 0}</strong>
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-[#E6E8EC] p-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            aria-label="Search franchise requests"
            placeholder="Search by ID, applicant, university, college, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-[#0A1D3F] placeholder-[#667085] focus:outline-none focus:border-[#0A1D3F] transition"
          />
        </form>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 flex-wrap bg-[#F7F8FA] rounded-xl border border-[#E6E8EC] self-start sm:self-auto">
          {["All", "Draft", "Pending", "Needs changes", "Approved", "Rejected"].map((st) => (
            <button
              key={st} aria-pressed={statusFilter === st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === st
                  ? "bg-[#0A1D3F] text-white shadow-xs"
                  : "text-[#667085] hover:text-[#0A1D3F]"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Franchise Requests List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-[#E6E8EC] p-12 text-center text-gray-400 text-sm">
          Loading franchise requests...
        </div>
      ) : franchises.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E6E8EC] p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#0A1D3F]">No Franchise Requests Found</h3>
          <p className="text-xs text-[#667085] max-w-sm mx-auto">
            There are no franchise registrations matching the current status filter.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E6E8EC] shadow-2xs overflow-hidden">
          <div className="admin-table admin-table-flush">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#F8FAFC] border-b border-[#E6E8EC] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Ref ID / Applicant</th>
                  <th className="py-3.5 px-4">University & College</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Submitted Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E8EC]">
                {franchises.map((fran) => {
                  const franId = fran._id || fran.id;
                  const uniName = fran.universityId?.name || "Independent institution";
                  const uniShort = fran.universityId?.shortName || "";
                  const colName = fran.institutionName || fran.collegeId?.name || "Institution";
                  return (
                    <tr
                      key={franId}
                      className="hover:bg-[#F8FAFC]/80 transition cursor-pointer"
                      onClick={() => handleOpenDetail(fran)}
                    >
                      {/* Ref ID & Contact Person */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-xs text-[#0A1D3F] block">
                          {fran.applicationId}
                        </span>
                        <div className="font-semibold text-[#0A1D3F] mt-0.5">
                          {fran.contactPerson}
                        </div>
                        <div className="text-[11px] text-[#64748B]">
                          {fran.email} • {fran.mobile}
                        </div>
                      </td>

                      {/* University & College Hierarchy */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <span className="inline-block px-1.5 py-0.2 rounded bg-[#0A1D3F]/10 text-[#0A1D3F] text-[10px] font-bold uppercase mb-0.5">
                          {uniShort || uniName}
                        </span>
                        <div className="font-semibold text-xs text-[#0A1D3F] truncate">
                          {colName}
                        </div>
                        <div className="text-[10px] text-[#64748B]">
                          {fran.universityId?.name ? 'under ' + uniName : 'Independent application'}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4 text-xs text-[#64748B]">
                        <div className="font-medium text-[#0A1D3F]">
                          {fran.city}, {fran.state}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono">
                          PIN: {fran.pincode}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-xs text-[#64748B]">
                        {new Date(fran.createdAt || Date.now()).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {getStatusBadge(fran.status)}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          aria-label={"Review franchise " + fran.reference}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail(fran);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#F7F8FA] hover:bg-[#0A1D3F] text-[#0A1D3F] hover:text-white font-semibold text-xs transition cursor-pointer border border-[#E6E8EC]"
                        >
                          <span>Review</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination meta={meta} onChange={setPage} loading={loading} />

      {/* ========================================================
          REVIEW / DETAIL MODAL
         ======================================================== */}
      {selectedFranchise && (() => {
        const requiredDocs = selectedFranchise.policySnapshot?.documents?.filter(d => d.required !== false) || [];
        const allRequiredVerified = requiredDocs.length > 0 && requiredDocs.every(req => {
          const doc = (selectedFranchise.franchiseDocuments || []).find(d => d.key === req.key);
          return doc?.state === 'verified';
        });

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
            <div
              ref={editorDialog}
              role="dialog"
              aria-modal="true"
              aria-label="Franchise application review"
              tabIndex={-1}
              className="admin-dialog bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full flex flex-col animate-in zoom-in-95 duration-150 text-left max-h-[92vh] overflow-hidden"
            >
              {/* Modal Sticky Header */}
              <div className="flex items-start justify-between p-4 sm:p-5 border-b border-slate-200 bg-white shrink-0">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-slate-100 text-[#0A1D3F] px-2.5 py-1 rounded-md border border-slate-200">
                      {selectedFranchise.applicationId}
                    </span>
                    {getStatusBadge(selectedFranchise.status)}
                    {selectedFranchise.affiliationState && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
                        {selectedFranchise.affiliationState.replaceAll('_', ' ')}
                      </span>
                    )}
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-[#0A1D3F]">
                    Franchise Application Review
                  </h2>
                </div>
                <button
                  type="button"
                  aria-label="Close franchise review"
                  onClick={() => setSelectedFranchise(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Scrollable Body */}
              <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
                {/* 1. Institution Profile Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    {selectedFranchise.institution?.logoAssetId ? (
                      <img
                        src={`/api/v1/media/${selectedFranchise.institution.logoAssetId}/content`}
                        alt="Institution Logo"
                        className="w-14 h-14 rounded-xl border border-slate-200 object-contain bg-white shadow-2xs shrink-0 p-1"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-[#0A1D3F]/10 text-[#0A1D3F] flex items-center justify-center shrink-0 shadow-2xs font-bold">
                        <Building2 className="w-7 h-7" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-base sm:text-lg text-[#0A1D3F] truncate">
                          {selectedFranchise.institutionName || 'Independent Institution'}
                        </h3>
                        {selectedFranchise.institutionType && (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#FF8A00]/10 text-[#FF8A00] border border-[#FF8A00]/20">
                            {selectedFranchise.institutionType}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                        {selectedFranchise.yearEstablished ? (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>Est. {selectedFranchise.yearEstablished}</span>
                          </span>
                        ) : null}
                        {selectedFranchise.website ? (
                          <a
                            href={selectedFranchise.website.startsWith('http') ? selectedFranchise.website : `https://${selectedFranchise.website}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:underline"
                          >
                            <Globe className="w-3.5 h-3.5" />
                            <span className="truncate max-w-[180px]">{selectedFranchise.website}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Institutional Placement Badge */}
                  <div className="shrink-0 self-start sm:self-auto">
                    {selectedFranchise.universityId?.name ? (
                      <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs text-left sm:text-right sm:max-w-xs space-y-0.5">
                        <div className="flex items-center gap-1.5 sm:justify-end text-[10px] uppercase font-bold text-slate-500">
                          <GraduationCap className="w-3.5 h-3.5 text-[#0A1D3F]" />
                          <span>Affiliated Placement</span>
                        </div>
                        <p className="font-bold text-xs text-[#0A1D3F] truncate">
                          {selectedFranchise.universityId.name} {selectedFranchise.universityId.shortName ? `(${selectedFranchise.universityId.shortName})` : ''}
                        </p>
                        {selectedFranchise.collegeId?.name && (
                          <p className="text-[11px] text-slate-500 truncate">
                            {selectedFranchise.collegeId.name} {selectedFranchise.collegeId.code ? `• ${selectedFranchise.collegeId.code}` : ''}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-2xs text-xs font-semibold text-slate-700">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Independent Institution</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Contact and Campus Location Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Authorized Contact */}
                  <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                      Authorized Representative
                    </span>
                    <div>
                      <p className="font-bold text-sm text-[#0A1D3F]">
                        {selectedFranchise.contactPerson || 'Not provided'}
                      </p>
                      {selectedFranchise.designation && (
                        <p className="text-xs text-slate-500 mt-0.5">{selectedFranchise.designation}</p>
                      )}
                    </div>
                    <div className="space-y-1.5 pt-2 border-t border-slate-200/80">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <a href={`mailto:${selectedFranchise.email}`} className="text-blue-600 hover:underline truncate">
                          {selectedFranchise.email}
                        </a>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{selectedFranchise.mobile}</span>
                        {selectedFranchise.alternateMobile && (
                          <span className="text-slate-400 text-[11px]">| Alt: {selectedFranchise.alternateMobile}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Campus Location */}
                  <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                      Campus Address & Location
                    </span>
                    <p className="text-xs text-[#0A1D3F] font-medium leading-relaxed">
                      {selectedFranchise.address || 'Address not supplied'}
                    </p>
                    <div className="text-xs text-slate-600">
                      <span>{selectedFranchise.city || ''}{selectedFranchise.state ? `, ${selectedFranchise.state}` : ''}</span>
                      {selectedFranchise.pincode && (
                        <span className="font-mono text-slate-500 ml-1.5 font-medium">PIN: {selectedFranchise.pincode}</span>
                      )}
                    </div>
                    {selectedFranchise.googleMapsLocation && (
                      <div className="pt-1.5 border-t border-slate-200/80">
                        <a
                          href={selectedFranchise.googleMapsLocation}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 font-semibold"
                        >
                          <MapPin className="w-3.5 h-3.5 text-blue-500" />
                          <span>View on Google Maps</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Academic Programs & Recognition */}
                {(selectedFranchise.recognitionAffiliation || selectedFranchise.programsOffered?.length > 0) && (
                  <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        Programs Offered & Recognition
                      </span>
                      {selectedFranchise.recognitionAffiliation && (
                        <span className="text-[10px] font-bold text-[#FF8A00] bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md">
                          {selectedFranchise.recognitionAffiliation}
                        </span>
                      )}
                    </div>
                    {selectedFranchise.programsOffered?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedFranchise.programsOffered.map((prog, pIdx) => (
                          <span
                            key={pIdx}
                            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-medium text-[#0A1D3F] shadow-2xs"
                          >
                            {prog}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Document Verification Cards (Core Action Step) */}
                {selectedFranchise.workflowVersion === 1 && (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div>
                        <h4 className="font-bold text-sm text-[#0A1D3F] flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#FF8A00]" />
                          <span>Institutional Verification Documents</span>
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Inspect credentials and verify each required document before approving the franchise.
                        </p>
                      </div>
                      <div className="self-start sm:self-auto">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                          allRequiredVerified
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {allRequiredVerified
                            ? 'All Required Verified ✓'
                            : `${(selectedFranchise.franchiseDocuments || []).filter(d => d.state === 'verified').length} / ${requiredDocs.length} Verified`}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(selectedFranchise.franchiseDocuments || []).map(doc => {
                        const policyDoc = selectedFranchise.policySnapshot?.documents?.find(d => d.key === doc.key);
                        const docLabel = policyDoc?.label || doc.key;
                        const isVerified = doc.state === 'verified';
                        const isRejected = doc.state === 'rejected';

                        return (
                          <div
                            key={doc.key}
                            className={`p-4 rounded-xl border transition-all space-y-3 ${
                              isVerified
                                ? 'bg-emerald-50/50 border-emerald-200 shadow-2xs'
                                : isRejected
                                ? 'bg-red-50/50 border-red-200 shadow-2xs'
                                : 'bg-white border-slate-200 shadow-2xs'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2.5 min-w-0">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                                  isVerified
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : isRejected
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-slate-100 text-slate-600'
                                }`}>
                                  <FileText className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-xs text-[#0A1D3F] truncate" title={docLabel}>
                                    {docLabel}
                                  </p>
                                  <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                    isVerified
                                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                      : isRejected
                                      ? 'bg-red-100 text-red-800 border-red-300'
                                      : 'bg-amber-100 text-amber-800 border-amber-300'
                                  }`}>
                                    {isVerified ? '✓ Verified' : isRejected ? '✕ Rejected' : 'Pending Review'}
                                  </span>
                                </div>
                              </div>

                              <a
                                href={'/api/v1/media/' + doc.assetId + '/content'}
                                target="_blank"
                                rel="noreferrer"
                                className="shrink-0 py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-blue-600 hover:text-blue-700 text-xs font-semibold inline-flex items-center gap-1 shadow-2xs transition cursor-pointer"
                                title="Open and inspect uploaded file"
                              >
                                <span>View</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>

                            {doc.reason && (
                              <p className="text-[11px] text-slate-600 p-2 rounded-lg bg-white/80 border border-slate-200 italic">
                                Remark: {doc.reason}
                              </p>
                            )}

                            {['Pending', 'Needs changes'].includes(selectedFranchise.status) && (
                              <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80">
                                <button
                                  type="button"
                                  disabled={processing || !can('franchises.review') || !adminNote.trim() || isVerified}
                                  onClick={async () => {
                                    setProcessing(true);
                                    try {
                                      await authenticatedWrite('/admin/franchise-applications/' + selectedFranchise.id + '/documents/review', {
                                        expectedRevision: selectedFranchise.revision,
                                        key: doc.key,
                                        state: 'verified',
                                        reason: adminNote
                                      });
                                      setSelectedFranchise(await adminService.getFranchise(selectedFranchise.id));
                                      showSuccess(`${docLabel} marked as verified`);
                                    } catch (e) {
                                      showError(e.message);
                                    } finally {
                                      setProcessing(false);
                                    }
                                  }}
                                  className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 text-white font-bold text-xs transition flex items-center justify-center gap-1 shadow-2xs cursor-pointer disabled:cursor-not-allowed"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                  <span>Verify</span>
                                </button>

                                <button
                                  type="button"
                                  disabled={processing || !can('franchises.review') || !adminNote.trim() || isRejected}
                                  onClick={async () => {
                                    setProcessing(true);
                                    try {
                                      await authenticatedWrite('/admin/franchise-applications/' + selectedFranchise.id + '/documents/review', {
                                        expectedRevision: selectedFranchise.revision,
                                        key: doc.key,
                                        state: 'rejected',
                                        reason: adminNote
                                      });
                                      setSelectedFranchise(await adminService.getFranchise(selectedFranchise.id));
                                      showSuccess(`${docLabel} marked as rejected`);
                                    } catch (e) {
                                      showError(e.message);
                                    } finally {
                                      setProcessing(false);
                                    }
                                  }}
                                  className="flex-1 py-1.5 px-2.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200 text-red-700 font-bold text-xs transition flex items-center justify-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                                >
                                  <XCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span>Reject</span>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {!adminNote.trim() && ['Pending', 'Needs changes'].includes(selectedFranchise.status) && (
                      <p className="text-[11px] text-amber-700 bg-amber-50/80 border border-amber-200 rounded-lg p-2.5 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Type an audit review note in the decision box below to enable the document verification buttons.</span>
                      </p>
                    )}
                  </div>
                )}

                {/* 5. Policy Terms & Agreement Accordion */}
                {selectedFranchise.workflowVersion === 1 && (
                  <details className="group rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-xs">
                    <summary className="font-bold text-slate-700 cursor-pointer flex items-center justify-between list-none">
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#FF8A00]" />
                        <span>Policy Terms & Accepted Agreement ({selectedFranchise.policySnapshot?.version || 'N/A'})</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 transition-transform group-open:rotate-90" />
                    </summary>
                    <div className="mt-3 pt-3 border-t border-slate-200 space-y-2 text-slate-600">
                      <p>
                        <strong>Eligible Institution Types:</strong> {selectedFranchise.policySnapshot?.institutionTypes?.join(', ') || 'All'}
                        {selectedFranchise.policySnapshot?.minimumYears > 0 ? ` • Minimum Established: ${selectedFranchise.policySnapshot.minimumYears} yrs` : ''}
                      </p>
                      {selectedFranchise.policySnapshot?.agreement?.text && (
                        <div className="p-3 bg-white rounded-lg border border-slate-200 max-h-36 overflow-y-auto whitespace-pre-wrap font-mono text-[11px] text-slate-700">
                          {selectedFranchise.policySnapshot.agreement.text}
                        </div>
                      )}
                    </div>
                  </details>
                )}

                {/* Rejection Reason Display if Rejected */}
                {selectedFranchise.status === "Rejected" && selectedFranchise.rejectionReason && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-1">
                    <span className="font-bold uppercase text-[10px] tracking-wider block text-red-600">
                      Reason for Rejection:
                    </span>
                    <p>{selectedFranchise.rejectionReason}</p>
                  </div>
                )}

                {/* 6. Admin Verification Notes / History */}
                {selectedFranchise.adminNotes && selectedFranchise.adminNotes.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                      Admin Verification Audit Log ({selectedFranchise.adminNotes.length})
                    </span>
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                      {selectedFranchise.adminNotes.map((n, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                            <span className="font-bold text-[#0A1D3F]">{n.author || "Admin Auditor"}</span>
                            <span>{new Date(n.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="text-slate-700 leading-relaxed">{n.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 7. Renewal Review Callout */}
                {selectedFranchise.affiliationState === 'renewal_review' && (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <p className="font-bold text-amber-900">Affiliation Renewal Review Required</p>
                      <p className="text-amber-800 text-[11px] mt-0.5">
                        This institution's renewal grace period has expired and requires administrative authorization.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={processing || !can('franchises.approve') || !adminNote.trim()}
                      onClick={async () => {
                        setProcessing(true);
                        try {
                          await authenticatedWrite('/admin/franchise-applications/' + selectedFranchise.id + '/renewal-review', {
                            expectedRevision: selectedFranchise.revision,
                            reason: adminNote
                          });
                          setSelectedFranchise(await adminService.getFranchise(selectedFranchise.id));
                          showSuccess('Renewal approved for payment or free renewal');
                        } catch (e) {
                          showError(e.message);
                        } finally {
                          setProcessing(false);
                        }
                      }}
                      className="py-2 px-3.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      Approve Expired Renewal
                    </button>
                  </div>
                )}

                {/* 8. Franchise Listing Controls (Approved Only) */}
                {selectedFranchise.workflowVersion === 1 && selectedFranchise.status === 'Approved' && (
                  <FranchiseListingControls
                    application={selectedFranchise}
                    reason={adminNote}
                    allowed={can('franchises.approve')}
                    busy={processing}
                    onBusy={setProcessing}
                    onError={e => showError(e)}
                    onChange={updated => {
                      setSelectedFranchise(current => ({
                        ...current,
                        listingPublishedAt: updated.listingPublishedAt,
                        listingHidden: updated.listingHidden,
                        collegeListingId: updated.collegeListingId,
                        revision: updated.revision,
                        statusHistory: updated.statusHistory
                      }));
                      setAdminNote('');
                      fetchFranchises();
                    }}
                  />
                )}
              </div>

              {/* Modal Sticky / Grounded Footer Action Panel */}
              <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/90 space-y-3 shrink-0">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <AdminField htmlFor="adminfranchiserequestspage-field-1" className="block text-xs font-bold text-[#0A1D3F]">
                      Admin Review Note / Decision Reason *
                    </AdminField>
                    <span className="text-[11px] text-slate-400">Required for verification, correction requests, and approval</span>
                  </div>
                  <AdminTextarea
                    helpLabel="Add Admin Note / Rejection Reason"
                    id="adminfranchiserequestspage-field-1"
                    rows={2}
                    placeholder="Enter audit remarks, document review notes, or specific reason if requesting changes/rejecting..."
                    value={adminNote}
                    onChange={(e) => {
                      setAdminNote(e.target.value);
                      setRejectionReason(e.target.value);
                    }}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-[#0A1D3F] focus:outline-none focus:ring-2 focus:ring-[#0A1D3F] transition shadow-2xs"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
                  {/* Left: Save Note Only */}
                  <button
                    type="button"
                    disabled={processing || !adminNote.trim() || !can('franchises.review')}
                    onClick={async () => {
                      setProcessing(true);
                      try {
                        const updated = await adminService.addFranchiseNote(selectedFranchise.id, adminNote, noteKey);
                        setSelectedFranchise(updated);
                        setAdminNote('');
                        setNoteKey(crypto.randomUUID());
                        showSuccess('Note saved without changing status');
                        fetchFranchises();
                      } catch (error) {
                        showError(error.message);
                      } finally {
                        setProcessing(false);
                      }
                    }}
                    className="py-2.5 px-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Save Note Only</span>
                  </button>

                  {/* Right: Decision Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedFranchise.workflowVersion === 1 && selectedFranchise.status === 'Pending' && (
                      <button
                        type="button"
                        disabled={processing || !can('franchises.review') || !adminNote.trim()}
                        onClick={() => handleStatusChange('Needs changes', adminNote)}
                        className="py-2.5 px-3.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Request Corrections</span>
                      </button>
                    )}

                    {selectedFranchise.status === 'Pending' && (
                      <button
                        type="button"
                        disabled={processing || !can('franchises.review') || (!adminNote.trim() && !rejectionReason.trim())}
                        onClick={() => handleStatusChange("Rejected", adminNote || rejectionReason)}
                        className="py-2.5 px-3.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-600 hover:text-white text-red-700 text-xs font-bold transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject Request</span>
                      </button>
                    )}

                    {selectedFranchise.status === 'Pending' && (
                      <button
                        type="button"
                        disabled={processing || !can('franchises.approve') || !adminNote.trim() || !allRequiredVerified}
                        title={!allRequiredVerified ? 'All required documents must be verified first' : !adminNote.trim() ? 'Enter a review note first' : 'Approve franchise'}
                        onClick={() => handleStatusChange("Approved", adminNote)}
                        className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        {processing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        <span>Approve Franchise</span>
                      </button>
                    )}

                    <SecondaryButton
                      type="button"
                      onClick={() => setSelectedFranchise(null)}
                      size="md"
                      className="cursor-pointer"
                    >
                      Close
                    </SecondaryButton>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 text-center">
                  {selectedFranchise.workflowVersion === 1
                    ? 'Verify required documents and record a review reason before approval. Approval lists the institution publicly. Approved free applications activate immediately; paid applications activate only after verified payment.'
                    : 'Legacy application: review approval does not activate affiliation. The applicant must submit a new application under the published policy.'}
                </p>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
