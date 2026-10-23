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
  ChevronRight
} from "lucide-react";
import { adminService } from "../services/adminService";
import { useToast } from "../../user/context/ToastContext";
import { PrimaryButton, SecondaryButton } from "../../user/components/common/PrimaryButton";

export const AdminFranchiseRequestsPage = () => {
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
  const [processing, setProcessing] = useState(false);

  const fetchFranchises = async () => {
    try {
      setLoading(true);
      const data = await adminService.getFranchiseRegistrations({
        status: statusFilter,
        search,
      });
      setFranchises(data || []);
    } catch (err) {
      showError("Failed to load franchise registrations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFranchises();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchFranchises();
  };

  const handleOpenDetail = (fran) => {
    setSelectedFranchise(fran);
    setRejectionReason(fran.rejectionReason || "");
    setAdminNote("");
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
        "Super Admin"
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

  return (
    <div className="space-y-6">
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
            Review and approve incoming franchise registration requests under the accredited University → College hierarchy.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-[#667085]">
          <span className="p-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            Total Requests: <strong className="text-[#0A1D3F]">{franchises.length}</strong>
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-[#E6E8EC] p-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, applicant, university, college, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl focus:outline-none focus:border-[#0A1D3F] transition"
          />
        </form>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#F7F8FA] rounded-xl border border-[#E6E8EC] self-start sm:self-auto">
          {["All", "Pending", "Approved", "Rejected"].map((st) => (
            <button
              key={st}
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
          <div className="overflow-x-auto">
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
                  const uniName = fran.universityId?.name || "Unknown University";
                  const uniShort = fran.universityId?.shortName || "";
                  const colName = fran.collegeId?.name || "Unknown College";

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
                          under {uniName}
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

      {/* ========================================================
          REVIEW / DETAIL MODAL
         ======================================================== */}
      {selectedFranchise && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#E6E8EC] shadow-2xl max-w-xl w-full p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150 text-left max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#E6E8EC]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-[#0A1D3F]">
                    {selectedFranchise.applicationId}
                  </span>
                  {getStatusBadge(selectedFranchise.status)}
                </div>
                <h2 className="text-base sm:text-lg font-bold text-[#0A1D3F] mt-1">
                  Franchise Application Details
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFranchise(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Institutional Hierarchy Summary */}
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2 text-xs">
              <div className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">
                Approved Hierarchy Placement
              </div>
              
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#0A1D3F]/10 text-[#0A1D3F] flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-[#64748B] block font-medium">
                    University / Franchise Provider
                  </span>
                  <span className="font-bold text-sm text-[#0A1D3F]">
                    {selectedFranchise.universityId?.name} ({selectedFranchise.universityId?.shortName})
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 pt-2 border-t border-[#E2E8F0]">
                <div className="w-7 h-7 rounded-lg bg-[#FF8A00]/10 text-[#FF8A00] flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-[#64748B] block font-medium">
                    College / Institute
                  </span>
                  <span className="font-bold text-sm text-[#0A1D3F] block">
                    {selectedFranchise.collegeId?.name}
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    Code: {selectedFranchise.collegeId?.code || "N/A"} • {selectedFranchise.collegeId?.city}, {selectedFranchise.collegeId?.state}
                  </span>
                </div>
              </div>
            </div>

            {/* Applicant Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                <span className="text-[10px] text-[#64748B] font-semibold uppercase block">
                  Authorized Contact
                </span>
                <span className="font-bold text-sm text-[#0A1D3F] block">
                  {selectedFranchise.contactPerson} {selectedFranchise.designation ? `(${selectedFranchise.designation})` : ""}
                </span>
                <div className="text-[11px] text-[#64748B] flex items-center gap-1.5 pt-1">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  <a href={`mailto:${selectedFranchise.email}`} className="hover:underline text-blue-600">
                    {selectedFranchise.email}
                  </a>
                </div>
                <div className="text-[11px] text-[#64748B] flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <span>{selectedFranchise.mobile}</span>
                  {selectedFranchise.alternateMobile && (
                    <span className="text-gray-400 text-[10px]">| Alt: {selectedFranchise.alternateMobile}</span>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                <span className="text-[10px] text-[#64748B] font-semibold uppercase block">
                  Campus Address
                </span>
                <p className="text-xs text-[#0A1D3F] font-medium leading-relaxed">
                  {selectedFranchise.address}
                </p>
                <div className="text-[11px] text-[#64748B] pt-1">
                  {selectedFranchise.city}, {selectedFranchise.state} - {selectedFranchise.pincode}
                </div>
                {selectedFranchise.googleMapsLocation && (
                  <div className="pt-1">
                    <a
                      href={selectedFranchise.googleMapsLocation}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <MapPin className="w-3 h-3" />
                      <span>View on Google Maps</span>
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Extra Academic & Document Details if present */}
            {(selectedFranchise.recognitionAffiliation || selectedFranchise.programsOffered?.length > 0 || selectedFranchise.documents) && (
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#64748B] font-semibold uppercase">
                    Academic & Verification Portfolio
                  </span>
                  {selectedFranchise.recognitionAffiliation && (
                    <span className="text-[10px] font-bold text-[#FF8A00] bg-[#FFF7ED] px-2 py-0.5 rounded-md">
                      {selectedFranchise.recognitionAffiliation}
                    </span>
                  )}
                </div>

                {selectedFranchise.programsOffered && selectedFranchise.programsOffered.length > 0 && (
                  <div>
                    <span className="text-[10px] text-[#64748B] block mb-1 font-medium">Programs Offered:</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedFranchise.programsOffered.map((prog, pIdx) => (
                        <span key={pIdx} className="px-2 py-0.5 rounded bg-white border border-[#E2E8F0] text-[10px] text-[#0A1D3F]">
                          {prog}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedFranchise.documents && typeof selectedFranchise.documents === "object" && Object.values(selectedFranchise.documents).some(Boolean) && (
                  <div className="pt-1.5 border-t border-[#E2E8F0]">
                    <span className="text-[10px] text-[#64748B] block mb-1 font-medium">Attached Documents:</span>
                    <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                      {Object.entries(selectedFranchise.documents).map(([k, v]) => v ? (
                        <div key={k} className="flex items-center gap-1.5 text-emerald-700 font-medium">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span className="truncate">{typeof v === "string" ? v : v.name || k}</span>
                        </div>
                      ) : null)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Rejection Reason display if rejected */}
            {selectedFranchise.status === "Rejected" && selectedFranchise.rejectionReason && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-1">
                <span className="font-bold uppercase text-[10px] tracking-wider block text-red-600">
                  Reason for Rejection:
                </span>
                <p>{selectedFranchise.rejectionReason}</p>
              </div>
            )}

            {/* Admin Notes / Log Section */}
            {selectedFranchise.adminNotes && selectedFranchise.adminNotes.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider block">
                  Admin Verification Notes
                </span>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {selectedFranchise.adminNotes.map((n, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-[11px]">
                      <div className="flex items-center justify-between text-[9px] text-gray-400 mb-0.5">
                        <span className="font-bold text-[#0A1D3F]">{n.author || "Admin"}</span>
                        <span>{new Date(n.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-gray-700">{n.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Note or Rejection Reason Input */}
            <div className="space-y-2 pt-2 border-t border-[#EDF2F7]">
              <label className="block text-xs font-bold text-[#0A1D3F]">
                Add Admin Note / Rejection Reason
              </label>
              <textarea
                rows={2}
                placeholder="Enter audit notes or specific reason if rejecting..."
                value={adminNote}
                onChange={(e) => {
                  setAdminNote(e.target.value);
                  setRejectionReason(e.target.value);
                }}
                className="w-full p-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs text-[#0A1D3F] focus:outline-none focus:border-[#0A1D3F] transition"
              />
            </div>

            {/* Approval / Rejection Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => handleStatusChange("Approved")}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve Franchise</span>
                </button>

                <button
                  type="button"
                  disabled={processing}
                  onClick={() => handleStatusChange("Rejected", adminNote || rejectionReason)}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Request</span>
                </button>
              </div>

              <SecondaryButton
                type="button"
                onClick={() => setSelectedFranchise(null)}
                size="md"
                className="w-full sm:w-auto cursor-pointer"
              >
                Close
              </SecondaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
