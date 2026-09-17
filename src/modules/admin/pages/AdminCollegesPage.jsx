import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  GraduationCap,
  MapPin,
  X,
  ExternalLink
} from "lucide-react";
import { adminService } from "../services/adminService";
import { useToast } from "../../user/context/ToastContext";
import { PrimaryButton, SecondaryButton } from "../../user/components/common/PrimaryButton";

export const AdminCollegesPage = () => {
  const { showSuccess, showError } = useToast();
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Modal State for Create / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCollege, setEditingCollege] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const initialForm = {
    name: "",
    logo: "https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=160&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&auto=format&fit=crop&q=80",
    description: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    location: "",
    collegeType: "Private University",
    status: "active",
    about: "",
    facilities: "High-Tech Labs, Central Digital Library, AC Hostels, Sports Complex, Wi-Fi Smart Classrooms",
    admissionInformation: "Admissions open for session 2026-2027. Direct admission based on merit and franchise counseling.",
    contactInformation: {
      phone: "+91 98110 00000",
      email: "admissions@college.edu.in",
      website: "https://college.edu.in",
    },
  };

  const [formData, setFormData] = useState(initialForm);

  const fetchColleges = async () => {
    try {
      setLoading(true);
      const data = await adminService.getColleges();
      setColleges(data);
    } catch (err) {
      showError("Failed to load colleges");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchColleges();
  }, []);

  const handleOpenCreate = () => {
    setEditingCollege(null);
    setFormData(initialForm);
    setModalOpen(true);
  };

  const handleOpenEdit = (college) => {
    setEditingCollege(college);
    setFormData({
      name: college.name || "",
      logo: college.logo || "",
      banner: college.banner || "",
      description: college.description || "",
      address: college.address || "",
      city: college.city || "",
      state: college.state || "",
      country: college.country || "India",
      location: college.location || "",
      collegeType: college.collegeType || "Private University",
      status: college.status || "active",
      about: college.about || college.description || "",
      facilities: Array.isArray(college.facilities) ? college.facilities.join(", ") : college.facilities || "",
      admissionInformation: college.admissionInformation || "",
      contactInformation: {
        phone: college.contactInformation?.phone || "",
        email: college.contactInformation?.email || "",
        website: college.contactInformation?.website || "",
      },
    });
    setModalOpen(true);
  };

  const handleToggleStatus = async (college) => {
    try {
      const cId = college._id || college.id;
      const updated = await adminService.toggleCollegeStatus(cId);
      showSuccess(`College status updated to ${updated.status}`);
      setColleges((prev) =>
        prev.map((c) => (String(c._id || c.id) === String(cId) ? { ...c, status: updated.status } : c))
      );
    } catch (err) {
      showError(err.message || "Failed to toggle status");
    }
  };

  const handleDelete = async (college) => {
    const cId = college._id || college.id;
    if (!window.confirm(`Are you sure you want to delete ${college.name}? All associated courses will be removed.`)) {
      return;
    }
    try {
      await adminService.deleteCollege(cId);
      showSuccess("College deleted successfully");
      setColleges((prev) => prev.filter((c) => String(c._id || c.id) !== String(cId)));
    } catch (err) {
      showError(err.message || "Failed to delete college");
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showError("College Name is required");
      return;
    }
    if (!formData.city.trim()) {
      showError("City is required");
      return;
    }

    try {
      setSaving(true);
      if (editingCollege) {
        const cId = editingCollege._id || editingCollege.id;
        const updated = await adminService.updateCollege(cId, formData);
        showSuccess("College updated successfully");
        setColleges((prev) =>
          prev.map((c) => (String(c._id || c.id) === String(cId) ? { ...c, ...updated } : c))
        );
      } else {
        const created = await adminService.createCollege(formData);
        showSuccess("Partner College created successfully");
        setColleges((prev) => [created, ...prev]);
      }
      setModalOpen(false);
    } catch (err) {
      showError(err.message || "Failed to save college");
    } finally {
      setSaving(false);
    }
  };

  // Filtered list
  const filteredColleges = colleges.filter((c) => {
    const matchesSearch =
      search.trim() === "" ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.city?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0A1D3F] tracking-tight">
            Partner Colleges Management
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] mt-0.5">
            Add, update, activate/deactivate, and manage affiliated franchise colleges.
          </p>
        </div>

        <PrimaryButton variant="navy" size="sm" onClick={handleOpenCreate} icon={Plus}>
          Add Partner College
        </PrimaryButton>
      </div>

      {/* Search and Status Filters */}
      <div className="bg-white p-4 rounded-2xl border border-[#E6E8EC] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#667085]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by college name or city..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#E6E8EC] text-xs focus:outline-none focus:border-[#FF8A00] bg-[#F7F8FA]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-[#667085] font-semibold">Status:</span>
          {["All", "active", "inactive"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition ${
                statusFilter === st
                  ? "bg-[#0A1D3F] text-white"
                  : "bg-[#F7F8FA] text-[#667085] hover:bg-gray-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Colleges Table / Cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white rounded-2xl border border-[#E6E8EC] animate-pulse" />
          ))}
        </div>
      ) : filteredColleges.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-2xl border border-[#E6E8EC]">
          <Building2 className="w-10 h-10 text-gray-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[#0A1D3F]">No Colleges Found</h3>
          <p className="text-xs text-[#667085] mt-1">
            Try adjusting your search query or add a new partner college.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E6E8EC] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F8FA] text-[#667085] font-bold uppercase tracking-wider border-b border-[#E6E8EC]">
                <tr>
                  <th className="py-3.5 px-4">College</th>
                  <th className="py-3.5 px-4">Type & Location</th>
                  <th className="py-3.5 px-4">Courses</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F2F5]">
                {filteredColleges.map((col) => {
                  const colId = col._id || col.id;
                  const isActive = col.status === "active";
                  return (
                    <tr key={colId} className="hover:bg-gray-50/70 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={col.logo || "https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=100&auto=format&fit=crop&q=80"}
                            alt={col.name}
                            className="w-10 h-10 rounded-xl object-cover border border-gray-200 shrink-0"
                          />
                          <div>
                            <div className="font-extrabold text-[#0A1D3F] text-sm">
                              {col.name}
                            </div>
                            <span className="text-[11px] text-[#667085] line-clamp-1">
                              {col.address || col.city}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#0A1D3F]">{col.collegeType}</div>
                        <div className="text-[11px] text-[#667085] flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-[#FF8A00]" />
                          <span>{col.location || col.city}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <Link
                          to={`/admin/colleges/${colId}/courses`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 text-[#FF8A00] font-bold hover:bg-orange-100 transition"
                        >
                          <GraduationCap className="w-3.5 h-3.5" />
                          <span>{col.totalCourses || 0} Courses</span>
                        </Link>
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleStatus(col)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] cursor-pointer transition ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                              : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
                          }`}
                        >
                          {isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          <span className="capitalize">{col.status}</span>
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={col.contactInformation?.website || col.website || `https://www.google.com/search?q=${encodeURIComponent(col.name + " official website")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Visit Official Website"
                            className="p-1.5 rounded-lg text-gray-500 hover:text-[#0A1D3F] hover:bg-gray-100 transition"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>

                          <Link
                            to={`/admin/colleges/${colId}/courses`}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-[#0A1D3F] hover:bg-gray-100 transition"
                          >
                            Courses
                          </Link>

                          <button
                            onClick={() => handleOpenEdit(col)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-[#FF8A00] hover:bg-orange-50 transition"
                            title="Edit College"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(col)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Delete College"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            className="fixed inset-0 bg-[#0A1D3F]/60 backdrop-blur-xs"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative bg-white w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl border border-[#E6E8EC] z-10 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E6E8EC] bg-white sticky top-0 z-10">
              <h3 className="text-base font-bold text-[#0A1D3F]">
                {editingCollege ? "Edit Partner College" : "Add New Partner College"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                    College Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Apex Institute of Technology & Management"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E6E8EC] focus:border-[#FF8A00] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                    College Type
                  </label>
                  <select
                    value={formData.collegeType}
                    onChange={(e) => setFormData({ ...formData, collegeType: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E6E8EC] focus:border-[#FF8A00] focus:outline-none"
                  >
                    <option value="Private University">Private University</option>
                    <option value="Autonomous College">Autonomous College</option>
                    <option value="Deemed University">Deemed University</option>
                    <option value="State University Campus">State University Campus</option>
                    <option value="Franchise Study Center">Franchise Study Center</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E6E8EC] focus:border-[#FF8A00] focus:outline-none"
                  >
                    <option value="active">Active (Visible to Students)</option>
                    <option value="inactive">Inactive (Hidden)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Noida, Pune, Bangalore"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E6E8EC] focus:border-[#FF8A00] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="e.g. Uttar Pradesh, Maharashtra"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E6E8EC] focus:border-[#FF8A00] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                    Campus Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Full street / sector address"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E6E8EC] focus:border-[#FF8A00] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                    Logo Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.logo}
                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E6E8EC] focus:border-[#FF8A00] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                    Banner Cover URL
                  </label>
                  <input
                    type="url"
                    value={formData.banner}
                    onChange={(e) => setFormData({ ...formData, banner: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E6E8EC] focus:border-[#FF8A00] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                    Short Description (For Cards)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Short 2-sentence summary of the college..."
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-[#E6E8EC] focus:border-[#FF8A00] focus:outline-none resize-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                    About College (Detailed Overview)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.about}
                    onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                    placeholder="Detailed history, accreditation, ranking, and placement statistics..."
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-[#E6E8EC] focus:border-[#FF8A00] focus:outline-none resize-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                    Campus Facilities (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.facilities}
                    onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
                    placeholder="e.g. AI Computing Labs, Hostels, Olympic Sports Complex, Digital Library"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E6E8EC] focus:border-[#FF8A00] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                    Admission Information & Guidelines
                  </label>
                  <textarea
                    rows={2}
                    value={formData.admissionInformation}
                    onChange={(e) => setFormData({ ...formData, admissionInformation: e.target.value })}
                    placeholder="Eligibility criteria, admission dates, scholarship policies..."
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-[#E6E8EC] focus:border-[#FF8A00] focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={formData.contactInformation.phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contactInformation: { ...formData.contactInformation, phone: e.target.value },
                      })
                    }
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E6E8EC] focus:border-[#FF8A00] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={formData.contactInformation.email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contactInformation: { ...formData.contactInformation, email: e.target.value },
                      })
                    }
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E6E8EC] focus:border-[#FF8A00] focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E6E8EC]">
                <SecondaryButton size="sm" onClick={() => setModalOpen(false)}>
                  Cancel
                </SecondaryButton>
                <PrimaryButton variant="orange" size="sm" type="submit" loading={saving}>
                  {editingCollege ? "Save Changes" : "Create College"}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
