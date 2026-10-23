import React, { useState, useEffect } from "react";
import {
  FileText,
  Search,
  Phone,
  Mail,
  Building2,
  GraduationCap,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  ChevronRight,
  X,
  Send,
  User,
  ExternalLink
} from "lucide-react";
import { adminService } from "../services/adminService";
import { useToast } from "../../user/context/ToastContext";
import { PrimaryButton, SecondaryButton } from "../../user/components/common/PrimaryButton";

export const AdminApplicationsPage = () => {
  const { showSuccess, showError } = useToast();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");

  // Detail Modal State
  const [selectedApp, setSelectedApp] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [newNote, setNewNote] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const data = await adminService.getApplications({
        status: statusFilter,
        search,
      });
      setApplications(data);
    } catch (err) {
      showError("Failed to load admission applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchApplications();
  };

  const handleOpenDetail = (app) => {
    setSelectedApp(app);
    setNewStatus(app.status);
    setNewNote("");
  };

  const handleStatusUpdate = async () => {
    if (!selectedApp) return;
    const appId = selectedApp._id || selectedApp.id;

    try {
      setUpdating(true);
      const updated = await adminService.updateApplicationStatus(
        appId,
        newStatus,
        newNote.trim() ? newNote.trim() : null,
        "Super Admin"
      );
      showSuccess(`Status changed to "${newStatus}"`);
      setSelectedApp(updated);
      setNewNote("");
      setApplications((prev) =>
        prev.map((a) => (String(a._id || a.id) === String(appId) ? updated : a))
      );
    } catch (err) {
      showError(err.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleAddNoteOnly = async () => {
    if (!newNote.trim() || !selectedApp) return;
    const appId = selectedApp._id || selectedApp.id;

    try {
      setUpdating(true);
      const updated = await adminService.addAdminNote(appId, newNote.trim(), "Super Admin");
      showSuccess("Internal note added");
      setSelectedApp(updated);
      setNewNote("");
      setApplications((prev) =>
        prev.map((a) => (String(a._id || a.id) === String(appId) ? updated : a))
      );
    } catch (err) {
      showError(err.message || "Failed to add note");
    } finally {
      setUpdating(false);
    }
  };

  const statusColors = {
    New: "bg-blue-50 text-blue-700 border-blue-200",
    Contacted: "bg-amber-50 text-amber-700 border-amber-200",
    "In Process": "bg-purple-50 text-purple-700 border-purple-200",
    Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Rejected: "bg-rose-50 text-rose-700 border-rose-200",
  };

  const statuses = ["All", "New", "Contacted", "In Process", "Approved", "Rejected"];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#0A1D3F] tracking-tight">
          Admission Applications & Enquiries
        </h1>
        <p className="text-xs sm:text-sm text-[#667085] mt-0.5">
          Track student enquiries, update counseling status, log internal notes, and approve admissions.
        </p>
      </div>

      {/* Filter Chips & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E6E8EC] shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#667085]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name, email, phone, college, or application ID..."
              className="w-full pl-10 pr-4 py-2 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#FF8A00]"
            />
          </div>
          <PrimaryButton variant="navy" size="sm" type="submit">
            Search
          </PrimaryButton>
        </form>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          <span className="text-xs font-bold text-[#667085] mr-1">Status:</span>
          {statuses.map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                statusFilter === st
                  ? "bg-[#0A1D3F] text-white shadow-xs"
                  : "bg-[#F7F8FA] text-[#667085] hover:bg-gray-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Applications Table / Cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-white rounded-2xl border border-[#E6E8EC] animate-pulse" />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-[#E6E8EC]">
          <FileText className="w-10 h-10 text-gray-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[#0A1D3F]">No Applications Found</h3>
          <p className="text-xs text-[#667085] mt-1">
            No student admission applications matching the selected criteria.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E6E8EC] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F8FA] text-[#667085] font-bold uppercase tracking-wider border-b border-[#E6E8EC]">
                <tr>
                  <th className="py-3.5 px-4">Application ID & Student</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">College & Course</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F2F5]">
                {applications.map((app) => {
                  const appId = app._id || app.id;
                  const dateStr = app.createdAt
                    ? new Date(app.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "Recent";

                  return (
                    <tr key={appId} className="hover:bg-gray-50/70 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-[11px] font-bold text-[#FF8A00]">
                          {app.applicationId}
                        </div>
                        <div className="font-extrabold text-[#0A1D3F] text-sm mt-0.5">
                          {app.studentDetails?.fullName}
                        </div>
                        {app.studentDetails?.educationalQualification && (
                          <span className="text-[10px] text-[#667085]">
                            {app.studentDetails.educationalQualification}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 space-y-1">
                        <div className="flex items-center gap-1.5 font-semibold text-[#0A1D3F]">
                          <Phone className="w-3 h-3 text-[#667085]" />
                          <a href={`tel:${app.studentDetails?.mobileNumber}`} className="hover:underline">
                            {app.studentDetails?.mobileNumber}
                          </a>
                        </div>
                        <div className="flex items-center gap-1.5 text-[#667085] text-[11px]">
                          <Mail className="w-3 h-3 text-[#667085]" />
                          <span className="truncate max-w-[150px]">{app.studentDetails?.email}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#0A1D3F] line-clamp-1">
                          {app.courseId?.courseName || "Course"}
                        </div>
                        <div className="text-[11px] text-[#667085] flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-[#FF8A00]" />
                          <span className="line-clamp-1">{app.collegeId?.name || "College"}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-[#667085]">
                        {dateStr}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full font-bold text-[11px] border ${
                            statusColors[app.status] || "bg-gray-50 text-gray-700"
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenDetail(app)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#0A1D3F] bg-gray-100 hover:bg-[#FF8A00] hover:text-white transition active:scale-95 shadow-2xs"
                        >
                          Review & Notes
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

      {/* DETAIL & STATUS WORKFLOW MODAL */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            className="fixed inset-0 bg-[#0A1D3F]/60 backdrop-blur-xs"
            onClick={() => setSelectedApp(null)}
          />
          <div className="relative bg-white w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl border border-[#E6E8EC] z-10 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E6E8EC] bg-white sticky top-0 z-10">
              <div>
                <span className="font-mono text-xs font-bold text-[#FF8A00]">
                  {selectedApp.applicationId}
                </span>
                <h3 className="text-base font-bold text-[#0A1D3F]">
                  Admission Application Review
                </h3>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* College & Course banner */}
              <div className="bg-[#F7F8FA] border border-[#E6E8EC] rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF8A00]">
                    Chosen College & Program
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusColors[selectedApp.status]}`}>
                    {selectedApp.status}
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-extrabold text-[#0A1D3F]">
                  {selectedApp.courseId?.courseName}
                </h4>
                <p className="text-xs text-[#667085]">
                  {selectedApp.collegeId?.name} • {selectedApp.collegeId?.city}
                </p>
              </div>

              {/* Student Details Grid */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#0A1D3F]">
                  Student Information
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white p-4 rounded-2xl border border-[#E6E8EC] text-xs">
                  <div>
                    <span className="text-[#667085] block text-[11px]">Full Name</span>
                    <strong className="text-[#0A1D3F]">{selectedApp.studentDetails?.fullName}</strong>
                  </div>
                  <div>
                    <span className="text-[#667085] block text-[11px]">Mobile Number</span>
                    <a
                      href={`tel:${selectedApp.studentDetails?.mobileNumber}`}
                      className="font-bold text-[#0A1D3F] hover:text-[#FF8A00]"
                    >
                      {selectedApp.studentDetails?.mobileNumber}
                    </a>
                  </div>
                  <div>
                    <span className="text-[#667085] block text-[11px]">Email</span>
                    <a
                      href={`mailto:${selectedApp.studentDetails?.email}`}
                      className="font-bold text-[#0A1D3F] hover:text-[#FF8A00] truncate block"
                    >
                      {selectedApp.studentDetails?.email}
                    </a>
                  </div>
                  <div>
                    <span className="text-[#667085] block text-[11px]">Date of Birth</span>
                    <span className="font-semibold text-[#0A1D3F]">{selectedApp.studentDetails?.dob || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[#667085] block text-[11px]">City</span>
                    <span className="font-semibold text-[#0A1D3F]">{selectedApp.studentDetails?.city || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[#667085] block text-[11px]">Qualification</span>
                    <span className="font-semibold text-[#0A1D3F]">{selectedApp.studentDetails?.educationalQualification || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[#667085] block text-[11px]">Passing Year</span>
                    <span className="font-semibold text-[#0A1D3F]">{selectedApp.studentDetails?.passingYear || "N/A"}</span>
                  </div>
                </div>

                {selectedApp.studentDetails?.additionalInfo && (
                  <div className="p-3 rounded-xl bg-orange-50/50 border border-orange-100 text-xs text-[#0A1D3F]">
                    <strong>Student Note:</strong> {selectedApp.studentDetails.additionalInfo}
                  </div>
                )}
              </div>

              {/* Status Workflow Selector */}
              <div className="space-y-2 pt-2 border-t border-[#E6E8EC]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#0A1D3F]">
                  Update Status Workflow
                </h4>
                <div className="flex flex-wrap gap-2">
                  {["New", "Contacted", "In Process", "Approved", "Rejected"].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setNewStatus(st)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition border ${
                        newStatus === st
                          ? "bg-[#0A1D3F] text-white border-[#0A1D3F] shadow-xs"
                          : "bg-[#F7F8FA] text-[#667085] border-[#E6E8EC] hover:bg-gray-200"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Internal Admin Notes */}
              <div className="space-y-3 pt-2 border-t border-[#E6E8EC]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#0A1D3F]">
                  Counselor & Admin Notes
                </h4>

                {/* Existing Notes List */}
                {selectedApp.adminNotes && selectedApp.adminNotes.length > 0 ? (
                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {selectedApp.adminNotes.map((n, i) => (
                      <div
                        key={n._id || i}
                        className="p-3 rounded-xl bg-[#F7F8FA] border border-[#E6E8EC] text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px] text-[#667085]">
                          <span className="font-bold text-[#0A1D3F]">{n.author || "Admin"}</span>
                          <span>
                            {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
                          </span>
                        </div>
                        <p className="text-[#0A1D3F]">{n.note}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#667085] italic">
                    No internal notes logged yet.
                  </p>
                )}

                {/* Add Note Input */}
                <div className="space-y-2">
                  <textarea
                    rows={2}
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add an internal note (e.g., 'Called student, scheduled counseling session on Friday')..."
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E6E8EC] focus:border-[#FF8A00] focus:outline-none resize-none"
                  />
                  <div className="flex justify-end gap-2">
                    {newNote.trim() && (
                      <SecondaryButton size="sm" onClick={handleAddNoteOnly} loading={updating}>
                        Save Note Only
                      </SecondaryButton>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-[#E6E8EC]">
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${selectedApp.studentDetails?.mobileNumber}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 hover:bg-emerald-100"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Student</span>
                  </a>
                  <a
                    href={`mailto:${selectedApp.studentDetails?.email}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 hover:bg-blue-100"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email</span>
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <SecondaryButton size="sm" onClick={() => setSelectedApp(null)}>
                    Close
                  </SecondaryButton>
                  <PrimaryButton
                    variant="orange"
                    size="sm"
                    loading={updating}
                    onClick={handleStatusUpdate}
                  >
                    Update Application
                  </PrimaryButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
