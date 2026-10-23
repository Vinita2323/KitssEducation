import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  X,
  ShieldCheck,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { adminService } from "../services/adminService";
import { useToast } from "../../user/context/ToastContext";
import { PrimaryButton, SecondaryButton } from "../../user/components/common/PrimaryButton";

export const AdminUniversitiesPage = () => {
  const { showSuccess, showError } = useToast();
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUni, setEditingUni] = useState(null);
  const [saving, setSaving] = useState(false);

  const initialForm = {
    name: "",
    shortName: "",
    logo: "https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=160&auto=format&fit=crop&q=80",
    status: "active",
  };

  const [formData, setFormData] = useState(initialForm);

  const fetchUniversities = async () => {
    try {
      setLoading(true);
      const data = await adminService.getUniversities({
        status: statusFilter,
        search,
      });
      setUniversities(data || []);
    } catch (err) {
      showError("Failed to load universities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUniversities();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUniversities();
  };

  const handleOpenCreate = () => {
    setEditingUni(null);
    setFormData(initialForm);
    setModalOpen(true);
  };

  const handleOpenEdit = (uni) => {
    setEditingUni(uni);
    setFormData({
      name: uni.name || "",
      shortName: uni.shortName || "",
      logo: uni.logo || initialForm.logo,
      status: uni.status || "active",
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showError("Please enter University Name");
      return;
    }
    if (!formData.shortName.trim()) {
      showError("Please enter Short Name / Acronym");
      return;
    }

    try {
      setSaving(true);
      if (editingUni) {
        const uId = editingUni._id || editingUni.id;
        await adminService.updateUniversity(uId, formData);
        showSuccess("University updated successfully");
      } else {
        await adminService.createUniversity(formData);
        showSuccess("University added successfully");
      }
      setModalOpen(false);
      fetchUniversities();
    } catch (err) {
      showError(err.message || "Failed to save university");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (uni) => {
    const uId = uni._id || uni.id;
    try {
      await adminService.toggleUniversityStatus(uId);
      showSuccess(`University status updated to ${uni.status === "active" ? "Inactive" : "Active"}`);
      fetchUniversities();
    } catch (err) {
      showError("Failed to update status");
    }
  };

  const handleDelete = async (uni) => {
    const uId = uni._id || uni.id;
    if (
      !window.confirm(
        `Are you sure you want to delete "${uni.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await adminService.deleteUniversity(uId);
      showSuccess("University deleted successfully");
      fetchUniversities();
    } catch (err) {
      showError(err.message || "Failed to delete university");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-[#E6E8EC] p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0A1D3F]/10 text-[#0A1D3F] flex items-center justify-center font-bold">
              <GraduationCap className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0A1D3F]">
              University Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            Manage approved parent universities and franchise providers across the platform hierarchy.
          </p>
        </div>

        <PrimaryButton
          onClick={handleOpenCreate}
          variant="navy"
          size="md"
          icon={Plus}
          className="shrink-0 cursor-pointer"
        >
          Add University
        </PrimaryButton>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-[#E6E8EC] p-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search universities by name or acronym..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl focus:outline-none focus:border-[#0A1D3F] transition"
          />
        </form>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#F7F8FA] rounded-xl border border-[#E6E8EC] self-start sm:self-auto">
          {["All", "active", "inactive"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition cursor-pointer ${
                statusFilter === st
                  ? "bg-[#0A1D3F] text-white shadow-xs"
                  : "text-[#667085] hover:text-[#0A1D3F]"
              }`}
            >
              {st === "All" ? "All Universities" : st}
            </button>
          ))}
        </div>
      </div>

      {/* Universities Table / Cards */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-[#E6E8EC] p-12 text-center text-gray-400 text-sm">
          Loading universities...
        </div>
      ) : universities.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E6E8EC] p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#0A1D3F]">No Universities Found</h3>
          <p className="text-xs text-[#667085] max-w-sm mx-auto">
            No universities match your active filters. Click "Add University" above to add an accredited franchise provider.
          </p>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0A1D3F] text-white text-xs font-semibold shadow-xs hover:bg-[#133C8B] transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add First University</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {universities.map((uni) => {
            const uId = uni._id || uni.id;
            return (
              <div
                key={uId}
                className="bg-white rounded-2xl border border-[#E6E8EC] p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top Row: Logo, Name, Status */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={uni.logo}
                        alt={uni.name}
                        className="w-12 h-12 rounded-xl object-cover border border-[#E6E8EC] shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-[#FF8A00] bg-[#FF8A00]/10 px-2 py-0.5 rounded uppercase tracking-wider inline-block mb-0.5">
                          {uni.shortName}
                        </span>
                        <h3 className="text-sm sm:text-base font-bold text-[#0A1D3F] truncate">
                          {uni.name}
                        </h3>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleStatus(uni)}
                      title={`Click to ${uni.status === "active" ? "deactivate" : "activate"}`}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold capitalize transition cursor-pointer ${
                        uni.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-gray-100 text-gray-500 border border-gray-200"
                      }`}
                    >
                      {uni.status === "active" ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <XCircle className="w-3 h-3 text-gray-400" />
                      )}
                      <span>{uni.status}</span>
                    </button>
                  </div>

                  {/* Colleges Count Stats Box */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-center text-xs">
                    <div>
                      <span className="text-[10px] text-[#64748B] block font-medium">
                        Total Colleges
                      </span>
                      <span className="font-bold text-sm text-[#0A1D3F]">
                        {uni.totalColleges || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#64748B] block font-medium">
                        Active Colleges
                      </span>
                      <span className="font-bold text-sm text-emerald-600">
                        {uni.activeColleges || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-[#EDF2F7]">
                  <Link
                    to={`/admin/colleges?universityId=${uId}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0A1D3F] hover:text-[#FF8A00] transition"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Manage Colleges</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(uni)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-[#0A1D3F] hover:bg-gray-100 transition cursor-pointer"
                      title="Edit University"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(uni)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                      title="Delete University"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================
          CREATE / EDIT UNIVERSITY MODAL
         ======================================================== */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#E6E8EC] shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E8EC]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0A1D3F]/10 text-[#0A1D3F] flex items-center justify-center font-bold">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-[#0A1D3F]">
                  {editingUni ? "Edit University" : "Add New University"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-left">
              {/* University Name */}
              <div>
                <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                  University Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g. Delhi University"
                  className="w-full px-3 py-2 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:border-[#0A1D3F] transition"
                  required
                />
              </div>

              {/* Short Name / Acronym */}
              <div>
                <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                  Short Name / Acronym <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.shortName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      shortName: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="e.g. DU, LPU, MAHE"
                  className="w-full px-3 py-2 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs sm:text-sm text-[#0A1D3F] uppercase font-mono focus:outline-none focus:border-[#0A1D3F] transition"
                  required
                />
              </div>

              {/* Logo URL */}
              <div>
                <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                  Logo URL (Optional)
                </label>
                <input
                  type="text"
                  value={formData.logo}
                  onChange={(e) =>
                    setFormData({ ...formData, logo: e.target.value })
                  }
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:border-[#0A1D3F] transition"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:border-[#0A1D3F] transition"
                >
                  <option value="active">Active (Visible in Registration)</option>
                  <option value="inactive">Inactive (Hidden)</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EDF2F7]">
                <SecondaryButton
                  type="button"
                  onClick={() => setModalOpen(false)}
                  size="md"
                  className="cursor-pointer"
                >
                  Cancel
                </SecondaryButton>
                <PrimaryButton
                  type="submit"
                  variant="navy"
                  size="md"
                  loading={saving}
                  className="cursor-pointer"
                >
                  {editingUni ? "Update University" : "Create University"}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
