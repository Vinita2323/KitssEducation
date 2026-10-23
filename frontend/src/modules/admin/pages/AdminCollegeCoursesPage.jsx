import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  GraduationCap,
  Plus,
  ArrowLeft,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  Building2
} from "lucide-react";
import { adminService } from "../services/adminService";
import { useToast } from "../../user/context/ToastContext";
import { PrimaryButton, SecondaryButton } from "../../user/components/common/PrimaryButton";

export const AdminCollegeCoursesPage = () => {
  const { collegeId } = useParams();
  const { showSuccess, showError } = useToast();

  const [college, setCollege] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [saving, setSaving] = useState(false);

  const initialForm = {
    courseName: "",
    degreeType: "Undergraduate",
    duration: "3 Years",
    eligibility: "10+2 with minimum 50% aggregate",
    fee: 90000,
    description: "",
    availableSeats: 60,
    admissionStatus: "Open",
    status: "active",
  };

  const [formData, setFormData] = useState(initialForm);

  const fetchCollegeAndCourses = async () => {
    try {
      setLoading(true);
      const data = await adminService.getCourses(collegeId);
      setCollege(data.college);
      setCourses(data.courses || []);
    } catch (err) {
      showError("Failed to load college courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollegeAndCourses();
  }, [collegeId]);

  const handleOpenCreate = () => {
    setEditingCourse(null);
    setFormData(initialForm);
    setModalOpen(true);
  };

  const handleOpenEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      courseName: course.courseName || "",
      degreeType: course.degreeType || "Undergraduate",
      duration: course.duration || "3 Years",
      eligibility: course.eligibility || "",
      fee: course.fee || 0,
      description: course.description || "",
      availableSeats: course.availableSeats || 60,
      admissionStatus: course.admissionStatus || "Open",
      status: course.status || "active",
    });
    setModalOpen(true);
  };

  const handleToggleStatus = async (course) => {
    try {
      const crsId = course._id || course.id;
      const updated = await adminService.toggleCourseStatus(crsId);
      showSuccess(`Course marked as ${updated.status}`);
      setCourses((prev) =>
        prev.map((c) => (String(c._id || c.id) === String(crsId) ? { ...c, status: updated.status } : c))
      );
    } catch (err) {
      showError(err.message || "Failed to toggle status");
    }
  };

  const handleDelete = async (course) => {
    const crsId = course._id || course.id;
    if (!window.confirm(`Delete course "${course.courseName}"?`)) return;

    try {
      await adminService.deleteCourse(crsId);
      showSuccess("Course deleted successfully");
      setCourses((prev) => prev.filter((c) => String(c._id || c.id) !== String(crsId)));
    } catch (err) {
      showError(err.message || "Failed to delete course");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.courseName.trim()) {
      showError("Course name is required");
      return;
    }

    try {
      setSaving(true);
      if (editingCourse) {
        const crsId = editingCourse._id || editingCourse.id;
        const updated = await adminService.updateCourse(crsId, formData);
        showSuccess("Course updated successfully");
        setCourses((prev) =>
          prev.map((c) => (String(c._id || c.id) === String(crsId) ? { ...c, ...updated } : c))
        );
      } else {
        const created = await adminService.createCourse(collegeId, formData);
        showSuccess("Course added successfully");
        setCourses((prev) => [created, ...prev]);
      }
      setModalOpen(false);
    } catch (err) {
      showError(err.message || "Failed to save course");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Link & Title */}
      <div>
        <Link
          to="/admin/colleges"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#667085] hover:text-[#0A1D3F] mb-3 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Partner Colleges</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#FF8A00]" />
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#0A1D3F] tracking-tight">
                {college ? college.name : "College Courses"}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[#667085] mt-0.5">
              Manage degrees, eligibility criteria, fees, and seat quotas for this institution.
            </p>
          </div>

          <PrimaryButton variant="navy" size="sm" onClick={handleOpenCreate} icon={Plus}>
            Add Course
          </PrimaryButton>
        </div>
      </div>

      {/* Course List Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-white rounded-2xl border border-[#E6E8EC] animate-pulse" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-2xl border border-[#E6E8EC]">
          <GraduationCap className="w-10 h-10 text-gray-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[#0A1D3F]">No Courses Configured</h3>
          <p className="text-xs text-[#667085] mt-1">
            Click "Add Course" to configure undergraduate, postgraduate, or diploma programs.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E6E8EC] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F8FA] text-[#667085] font-bold uppercase tracking-wider border-b border-[#E6E8EC]">
                <tr>
                  <th className="py-3.5 px-4">Program / Course</th>
                  <th className="py-3.5 px-4">Degree & Duration</th>
                  <th className="py-3.5 px-4">Annual Fee</th>
                  <th className="py-3.5 px-4">Seats & Admission</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F2F5]">
                {courses.map((crs) => {
                  const crsId = crs._id || crs.id;
                  const isActive = crs.status === "active";
                  return (
                    <tr key={crsId} className="hover:bg-gray-50/70 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-[#0A1D3F] text-sm">
                          {crs.courseName}
                        </div>
                        <div className="text-[11px] text-[#667085] mt-0.5 line-clamp-1">
                          Eligibility: {crs.eligibility}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-[#0A1D3F] px-2 py-0.5 rounded bg-gray-100">
                          {crs.degreeType}
                        </span>
                        <div className="text-[11px] text-[#667085] mt-1">
                          {crs.duration}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-extrabold text-[#0A1D3F]">
                        ₹{crs.fee ? crs.fee.toLocaleString() : "0"}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#0A1D3F]">
                          {crs.availableSeats || 60} Seats
                        </div>
                        <span className="inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {crs.admissionStatus || "Open"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleStatus(crs)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] cursor-pointer transition ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                              : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
                          }`}
                        >
                          {isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          <span className="capitalize">{crs.status}</span>
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(crs)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-[#FF8A00] hover:bg-orange-50 transition"
                            title="Edit Course"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(crs)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Delete Course"
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

      {/* CREATE / EDIT COURSE MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            className="fixed inset-0 bg-[#0A1D3F]/60 backdrop-blur-xs"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative bg-white w-full max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl border border-[#E6E8EC] z-10 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E6E8EC] bg-white sticky top-0 z-10">
              <h3 className="text-base font-bold text-[#0A1D3F]">
                {editingCourse ? "Edit Course" : "Add Course to College"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                  Course / Program Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.courseName}
                  onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                  placeholder="e.g. B.Tech Computer Science & Engineering"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E6E8EC] focus:border-[#FF8A00] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                    Degree Type
                  </label>
                  <select
                    value={formData.degreeType}
                    onChange={(e) => setFormData({ ...formData, degreeType: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E6E8EC] focus:border-[#FF8A00] focus:outline-none"
                  >
                    <option value="Undergraduate">Undergraduate</option>
                    <option value="Postgraduate">Postgraduate</option>
                    <option value="Diploma">Diploma</option>
                    <option value="Doctorate">Doctorate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g. 3 Years or 4 Years"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E6E8EC] focus:border-[#FF8A00] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                    Annual Tuition Fee (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.fee}
                    onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E6E8EC] focus:border-[#FF8A00] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                    Available Seats
                  </label>
                  <input
                    type="number"
                    value={formData.availableSeats}
                    onChange={(e) => setFormData({ ...formData, availableSeats: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E6E8EC] focus:border-[#FF8A00] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                  Eligibility Criteria
                </label>
                <input
                  type="text"
                  value={formData.eligibility}
                  onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
                  placeholder="e.g. 10+2 with Physics, Chem, Math (Min 50%)"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E6E8EC] focus:border-[#FF8A00] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief curriculum overview..."
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-[#E6E8EC] focus:border-[#FF8A00] focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                    Admission Status
                  </label>
                  <select
                    value={formData.admissionStatus}
                    onChange={(e) => setFormData({ ...formData, admissionStatus: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E6E8EC] focus:border-[#FF8A00] focus:outline-none"
                  >
                    <option value="Open">Open</option>
                    <option value="Closed">Closed</option>
                    <option value="Upcoming">Upcoming</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                    Visibility Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E6E8EC] focus:border-[#FF8A00] focus:outline-none"
                  >
                    <option value="active">Active (Visible)</option>
                    <option value="inactive">Inactive (Hidden)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E6E8EC]">
                <SecondaryButton size="sm" onClick={() => setModalOpen(false)}>
                  Cancel
                </SecondaryButton>
                <PrimaryButton variant="orange" size="sm" type="submit" loading={saving}>
                  {editingCourse ? "Update Course" : "Add Course"}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
