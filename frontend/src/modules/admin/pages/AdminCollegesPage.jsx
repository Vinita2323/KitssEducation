import { AdminField, AdminInput, AdminSelect, AdminTextarea } from '../components/AdminFields';
import { useDialogFocus } from '../../../shared/ui/useDialogFocus';
import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
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
  ExternalLink,
  ChevronRight,
  Filter
} from "lucide-react";
import { Pagination } from '../../user/components/common/Pagination';
import { useAuth } from '../../user/context/AuthContext';
import { collegeService } from '../../user/services/collegeService';
import { adminService } from "../services/adminService";
import { useToast } from "../../user/context/ToastContext";
import { PrimaryButton, SecondaryButton } from "../../user/components/common/PrimaryButton";



export const AdminCollegesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialUniParam = searchParams.get("universityId") || "All";

  const { can } = useAuth();
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);
  const [loadError, setLoadError] = useState('');
  const { showSuccess, showError } = useToast();
  const [colleges, setColleges] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedUniFilter, setSelectedUniFilter] = useState(initialUniParam);

  // Modal State for Create / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCollege, setEditingCollege] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const initialForm = {
    name: "",
    code: "",
    universityId: "",
    logo: "",
    banner: "",
    description: "",
    address: "",
    city: "",
    district: "",
    state: "", stateId: "", category: "College", verification: { state: "unverified", source: "" },
    country: "India",
    location: "",
    collegeType: "",
    status: "draft",
    about: "",
    facilities: "",
    admissionInformation: "",
    contactInformation: {
      phone: "",
      email: "",
      website: "",
    },
  };

  const [states, setStates] = useState([]), [districts, setDistricts] = useState([]);
  useEffect(() => { collegeService.getTaxonomies('state').then(setStates).catch(error => showError(error.message)); }, []);
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => { if (formData.stateId) collegeService.getTaxonomies('district', formData.stateId).then(setDistricts).catch(error => showError(error.message)); else setDistricts([]); }, [formData.stateId]);
  const fetchUniversities = async () => {
    try {
      const data = await adminService.getUniversities();
      setUniversities(data || []);
    } catch (err) {
      console.error("Failed to load universities", err);
    }
  };

  const fetchColleges = async () => {
    try {
      setLoading(true);
      const result = await adminService.page('colleges', { page,
        universityId: selectedUniFilter,
        status: statusFilter,
        search,
       });
      const data = result.data; setMeta(result.meta); setLoadError('');
      setColleges(data || []);
    } catch (err) {
      setLoadError(err.message); setColleges([]); showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUniversities();
  }, []);

  useEffect(() => {
    fetchColleges();
  }, [selectedUniFilter, statusFilter, search, page]);

  useEffect(() => { setPage(1); }, [statusFilter, search]);
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchColleges();
  };

  const handleUniFilterChange = (uniId) => {
    setSelectedUniFilter(uniId);
    if (uniId === "All") {
      searchParams.delete("universityId");
    } else {
      searchParams.set("universityId", uniId);
    }
    setSearchParams(searchParams);
  };

  const handleOpenCreate = () => {
    setEditingCollege(null);
    const defaultUniId =
      selectedUniFilter !== "All"
        ? selectedUniFilter
        : universities[0]?._id || universities[0]?.id || "";

    setFormData({
      ...initialForm,
      universityId: defaultUniId,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (college) => {
    setEditingCollege(college);
    const uId =
      typeof college.universityId === "object"
        ? college.universityId?._id || college.universityId?.id
        : college.universityId;

    setFormData({
      name: college.name || "",
      code: college.code || "",
      universityId: uId || "",
      logo: college.logo || "",
      banner: college.banner || "",
      description: college.description || "",
      address: college.address || "",
      city: college.city || "",
      district: college.district || college.city || "",
      state: college.state || "", stateId: college.stateId || "", category: college.category || "College", verification: college.verification || { state: "unverified", source: "" },
      country: college.country || "India",
      location: college.location || "",
      collegeType: college.collegeType || "",
      status: college.status || "active",
      about: college.about || college.description || "",
      facilities: Array.isArray(college.facilities)
        ? college.facilities.join(", ")
        : college.facilities || "",
      admissionInformation: college.admissionInformation || "",
      contactInformation: {
        phone: college.contactInformation?.phone || "",
        email: college.contactInformation?.email || "",
        website: college.contactInformation?.website || "",
      },
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showError("Please enter college name");
      return;
    }
    if (!formData.universityId) {
      showError("Please select parent University");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...formData,
        facilities: formData.facilities
          ? formData.facilities.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
      };

      if (editingCollege) {
        const cId = editingCollege._id || editingCollege.id;
        await adminService.updateCollege(cId, { ...payload, expectedRevision: editingCollege.revision });
        showSuccess("College updated successfully");
      } else {
        await adminService.createCollege(payload);
        showSuccess("College added successfully");
      }

      setModalOpen(false);
      fetchColleges();
    } catch (err) {
      showError(err.message || "Failed to save college");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (college) => {
    const cId = college._id || college.id;
    try {
      await adminService.toggleCollegeStatus(cId, college);
      showSuccess(
        `College status updated to ${
          college.status === "active" ? "Inactive" : "Active"
        }`
      );
      fetchColleges();
    } catch (err) {
      showError("Failed to update status");
    }
  };

  const handleDelete = async (college) => {
    const cId = college._id || college.id;
    if (
      !window.confirm(
        `Are you sure you want to delete "${college.name}" and all its courses?`
      )
    ) {
      return;
    }

    try {
      await adminService.deleteCollege(cId, college);
      showSuccess("College archived successfully");
      fetchColleges();
    } catch (err) {
      showError(err.message || "Failed to delete college");
    }
  };
  const editorDialog = useDialogFocus(modalOpen, () => setModalOpen(false));
  return (
    <div className="space-y-6">
      {loadError && <p role="alert" className="p-3 bg-red-50 text-red-700 rounded-xl">{loadError}</p>}
      <Pagination meta={meta} onChange={setPage} loading={loading} />
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-[#E6E8EC] p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0A1D3F]/10 text-[#0A1D3F] flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0A1D3F]">
              College & Institute Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            Manage authorized colleges and institutes under accredited partner universities.
          </p>
        </div>

        <PrimaryButton
          disabled={!can('institutions.write')} onClick={handleOpenCreate}
          variant="navy"
          size="md"
          icon={Plus}
          className="shrink-0 cursor-pointer"
        >
          Add College / Institute
        </PrimaryButton>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-[#E6E8EC] p-4 shadow-2xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <AdminInput
            type="text"
            aria-label="Search colleges" placeholder="Search colleges by name, code, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl focus:outline-none focus:border-[#0A1D3F] transition"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* University Dropdown Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-[#64748B] hidden sm:inline">
              University:
            </span>
            <AdminSelect
              aria-label="Filter colleges by university" value={selectedUniFilter}
              onChange={(e) => handleUniFilterChange(e.target.value)}
              className="px-3 py-2 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs text-[#0A1D3F] font-semibold focus:outline-none focus:border-[#0A1D3F]"
            >
              <option value="All">All Universities</option>
              {universities.map((uni) => (
                <option key={uni._id || uni.id} value={uni._id || uni.id}>
                  {uni.shortName} - {uni.name}
                </option>
              ))}
            </AdminSelect>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 p-1 bg-[#F7F8FA] rounded-xl border border-[#E6E8EC]">
            {["All", "active", "inactive"].map((st) => (
              <button
                key={st} aria-pressed={statusFilter === st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition cursor-pointer ${
                  statusFilter === st
                    ? "bg-[#0A1D3F] text-white shadow-xs"
                    : "text-[#667085] hover:text-[#0A1D3F]"
                }`}
              >
                {st === "All" ? "All Status" : st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Colleges Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-[#E6E8EC] p-12 text-center text-gray-400 text-sm">
          Loading colleges...
        </div>
      ) : colleges.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E6E8EC] p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#0A1D3F]">No Colleges Found</h3>
          <p className="text-xs text-[#667085] max-w-sm mx-auto">
            No colleges match the selected university or status filters.
          </p>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0A1D3F] text-white text-xs font-semibold shadow-xs hover:bg-[#133C8B] transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New College</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {colleges.map((college) => {
            const cId = college._id || college.id;
            const uniName =
              college.universityId?.name || "University not supplied";
            const uniShort = college.universityId?.shortName || "";
            return (
              <div
                key={cId}
                className="bg-white rounded-2xl border border-[#E6E8EC] p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3.5"
              >
                <div>
                  {/* Top: University Badge & Status */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#0A1D3F]/10 text-[#0A1D3F] text-[10px] font-bold uppercase tracking-wider truncate max-w-[65%]">
                      <GraduationCap className="w-3 h-3 shrink-0" />
                      <span className="truncate">{uniShort || uniName}</span>
                    </span>

                    <button
                      disabled={!can('institutions.write')} onClick={() => handleToggleStatus(college)}
                      title={`Click to ${
                        college.status === "active" ? "deactivate" : "activate"
                      }`}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold capitalize transition cursor-pointer ${
                        college.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-gray-100 text-gray-500 border border-gray-200"
                      }`}
                    >
                      {college.status === "active" ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <XCircle className="w-3 h-3 text-gray-400" />
                      )}
                      <span>{college.status}</span>
                    </button>
                  </div>

                  {/* College Name & Code */}
                  <div className="flex items-start gap-3">
                    <img
                      src={college.logo}
                      alt={college.name}
                      className="w-10 h-10 rounded-xl object-cover border border-[#E6E8EC] shrink-0"
                    />
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-[#0A1D3F] leading-tight">
                        {college.name}
                      </h3>
                      <div className="text-[11px] text-[#64748B] flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 shrink-0 text-gray-400" />
                        <span>
                          {college.city}, {college.state}
                        </span>
                        {college.code && (
                          <span className="font-mono text-[10px] text-gray-400">
                            • {college.code}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Mini Stats Grid */}
                  <div className="grid grid-cols-2 gap-2 mt-3 p-2 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-center text-xs">
                    <div>
                      <span className="text-[9px] text-[#64748B] block font-medium uppercase">
                        Courses
                      </span>
                      <span className="font-bold text-xs text-[#0A1D3F]">
                        {college.totalCourses || 0} Listed
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#64748B] block font-medium uppercase">
                        Affiliation
                      </span>
                      <span className="font-bold text-xs text-emerald-600 truncate block">
                        {college.collegeType || "Not supplied"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between pt-2.5 border-t border-[#EDF2F7]">
                  <Link
                    to={`/admin/colleges/${cId}/courses`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0A1D3F] hover:text-[#FF8A00] transition"
                  >
                    <span>Manage Courses</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>

                  <div className="flex items-center gap-1">
                    <button
                      disabled={!can('institutions.write')} aria-label="Edit college" onClick={() => handleOpenEdit(college)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-[#0A1D3F] hover:bg-gray-100 transition cursor-pointer"
                      title="Edit College"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={!can('institutions.write')} aria-label="Archive college" onClick={() => handleDelete(college)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                      title="Delete College"
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
          CREATE / EDIT COLLEGE MODAL
         ======================================================== */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div ref={editorDialog} role="dialog" aria-modal="true" aria-label="College editor" tabIndex={-1} className="bg-white rounded-2xl border border-[#E6E8EC] shadow-2xl max-w-xl w-full p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E8EC]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0A1D3F]/10 text-[#0A1D3F] flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-[#0A1D3F]">
                  {editingCollege ? "Edit College / Institute" : "Add New College / Institute"}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close college editor" onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              {/* Parent University Selection */}
              <div>
                <AdminField className="block text-xs font-bold text-[#0A1D3F] mb-1">
                  Parent University / Franchise Provider <span className="text-red-500">*</span>
                </AdminField>
                <AdminSelect
                  disabled={Boolean(editingCollege)} aria-label="College universityId" value={formData.universityId}
                  onChange={(e) =>
                    setFormData({ ...formData, universityId: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs sm:text-sm text-[#0A1D3F] font-semibold focus:outline-none focus:border-[#0A1D3F]"
                  required
                >
                  <option value="" disabled>Select parent university</option>
                  {universities.map((uni) => (
                    <option key={uni._id || uni.id} value={uni._id || uni.id}>
                      {uni.name} ({uni.shortName})
                    </option>
                  ))}
                </AdminSelect>
              </div>

              {/* College Name & Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <AdminField className="block text-xs font-bold text-[#0A1D3F] mb-1">
                    College / Institute Name <span className="text-red-500">*</span>
                  </AdminField>
                  <AdminInput
                    type="text"
                    aria-label="College name" value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g. Miranda House / School of Engineering"
                    className="w-full px-3 py-2 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:border-[#0A1D3F]"
                    required
                  />
                </div>

                <div>
                  <AdminField htmlFor="admincollegespage-field-1" className="block text-xs font-bold text-[#0A1D3F] mb-1">
                    Code / Reg ID
                  </AdminField>
                  <AdminInput
                    helpLabel="Code / Reg ID" id="admincollegespage-field-1"
                    type="text"
                    aria-label="College code" value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    placeholder="e.g. DU-MH-101"
                    className="w-full px-3 py-2 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs sm:text-sm text-[#0A1D3F] uppercase font-mono focus:outline-none focus:border-[#0A1D3F]"
                  />
                </div>
              </div>

              {/* City, State, Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <AdminField className="block text-xs font-bold text-[#0A1D3F] mb-1">
                    City <span className="text-red-500">*</span>
                  </AdminField>
                  <AdminInput
                    type="text"
                    aria-label="College city" value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    placeholder="e.g. New Delhi"
                    className="w-full px-3 py-2 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:border-[#0A1D3F]"
                    required
                  />
                </div>

                <div>
                  <AdminField className="block text-xs font-bold text-[#0A1D3F] mb-1">
                    State <span className="text-red-500">*</span>
                  </AdminField>
                  <AdminSelect
                    aria-label="College stateId" value={formData.stateId}
                    onChange={(e) =>
                      setFormData({ ...formData, stateId: e.target.value, district: "" })
                    }
                    className="w-full px-3 py-2 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs text-[#0A1D3F] focus:outline-none focus:border-[#0A1D3F]"
                    required
                  >
                    <option value="">Select state</option>{states.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.label}
                      </option>
                    ))}
                  </AdminSelect>
                </div>

                <div>
                  <AdminField htmlFor="admincollegespage-field-2" className="block text-xs font-bold text-[#0A1D3F] mb-1">
                    College Type
                  </AdminField>
                  <AdminSelect
                    helpLabel="College Type" id="admincollegespage-field-2"
                    aria-label="College collegeType" value={formData.collegeType}
                    onChange={(e) =>
                      setFormData({ ...formData, collegeType: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs text-[#0A1D3F] focus:outline-none focus:border-[#0A1D3F]"
                  >
                    <option value="">Select type</option><option value="Constituent College">Constituent College</option>
                    <option value="Affiliated College">Affiliated College</option>
                    <option value="Autonomous College">Autonomous College</option>
                    <option value="Faculty / School">Faculty / School</option>
                    <option value="Institute">Institute</option>
                  </AdminSelect>
                </div>
              </div>

              <AdminField className="block text-xs font-bold">District<AdminSelect className="w-full p-2 border rounded-xl" aria-label="College district" value={formData.district} onChange={e => setFormData({ ...formData, district: e.target.value })} required><option value="">Select district</option>{districts.map(d => <option key={d.id} value={d.label}>{d.label}</option>)}</AdminSelect></AdminField>
              <AdminField className="block text-xs font-bold">Directory category<AdminSelect className="w-full p-2 border rounded-xl" aria-label="College category" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>{['University','College','School','Institute'].map(value => <option key={value}>{value}</option>)}</AdminSelect></AdminField>
              <AdminField className="block text-xs"><AdminInput type="checkbox" checked={formData.verification?.state === 'verified'} onChange={e => setFormData({ ...formData, verification: { ...formData.verification, state: e.target.checked ? 'verified' : 'unverified' } })} /> Relationship verified by authorized reviewer</AdminField>
              <AdminField className="block text-xs font-bold">Verification evidence reference<AdminInput aria-label="Verification evidence reference" className="w-full p-2 border rounded-xl" value={formData.verification?.source || ''} onChange={e => setFormData({ ...formData, verification: { ...formData.verification, source: e.target.value } })} placeholder="Approved source/reference, required to publish" /></AdminField>
              {/* Address */}
              <div>
                <AdminField htmlFor="admincollegespage-field-3" className="block text-xs font-bold text-[#0A1D3F] mb-1">
                  Campus Address
                </AdminField>
                <AdminInput
                  helpLabel="Campus Address" id="admincollegespage-field-3"
                  type="text"
                  aria-label="College address" value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="e.g. University Enclave, North Campus"
                  className="w-full px-3 py-2 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:border-[#0A1D3F]"
                />
              </div>

              {/* Description */}
              <div>
                <AdminField htmlFor="admincollegespage-field-4" className="block text-xs font-bold text-[#0A1D3F] mb-1">
                  Brief Overview
                </AdminField>
                <AdminTextarea
                  helpLabel="Brief Overview" id="admincollegespage-field-4"
                  rows={2}
                  aria-label="College description" value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Overview of academic excellence, NIRF rating, specializations..."
                  className="w-full px-3 py-2 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs text-[#0A1D3F] focus:outline-none focus:border-[#0A1D3F]"
                />
              </div>

              {/* Status */}
              <div>
                <AdminField htmlFor="admincollegespage-field-5" className="block text-xs font-bold text-[#0A1D3F] mb-1">
                  Status
                </AdminField>
                <AdminSelect
                  helpLabel="Status" id="admincollegespage-field-5"
                  aria-label="College status" value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:border-[#0A1D3F]"
                >
                  <option value="draft">Draft</option><option value="active">Active (Visible in Franchise Selection)</option>
                  <option value="inactive">Inactive (Hidden)</option>
                </AdminSelect>
              </div>

              {/* Modal Actions */}
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
                  {editingCollege ? "Update College" : "Create College"}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
