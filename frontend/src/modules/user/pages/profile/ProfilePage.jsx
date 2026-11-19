import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Phone,
  Calendar,
  GraduationCap,
  KeyRound,
  ShoppingBag,
  Video,
  LogOut,
  ChevronRight,
  TrendingUp,
  BookOpen,
  Edit3
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useLibrary } from "../../context/LibraryContext";
import { Modal } from "../../components/common/Modal";
import { PrimaryButton, SecondaryButton } from "../../components/common/PrimaryButton";

import { authService } from '../../services/authService';
import { collegeService } from '../../services/collegeService';
import { coachingService } from '../../services/coachingService';
import { isPhoneNumber, PHONE_HINT } from '../../../../shared/validation/phone';

// Today as YYYY-MM-DD in the viewer's own calendar, for the date-of-birth upper bound.
const localToday = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
const formatDob = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') ? new Date(value + 'T00:00:00Z').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : '';
// Saved values stay selectable even if the dropdown entry was later renamed or deactivated.
const withSaved = (labels, saved) => saved && !labels.includes(saved) ? [saved, ...labels] : labels;
const profileForm = user => ({ name: user?.name || "", email: user?.email || "", phone: user?.phone || "", board: user?.board || "", class: user?.class || "", dob: user?.dob || "" });

export const ProfilePage = () => {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { purchasedBookIds } = useLibrary();
  const purchasedCount = purchasedBookIds?.length || 0;

  // Learning summary from the student's real course enrollments (null while loading, false if it failed).
  const [learning, setLearning] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    coachingService.getMyCourses(controller.signal).then(rows => {
      const active = rows.filter(row => row.isEnrolled);
      const lectures = active.reduce((n, row) => n + (Number(row.completedLectures) || 0), 0);
      const progress = active.length ? Math.round(active.reduce((n, row) => n + (Number(row.progressPercentage) || 0), 0) / active.length) : 0;
      setLearning({ courses: active.length, lectures, progress });
    }).catch(() => { if (!controller.signal.aborted) setLearning(false); });
    return () => controller.abort();
  }, [user?.id]);
  const stat = value => learning ? value : '—';

  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Edit form state
  const [editData, setEditData] = useState(() => profileForm(user));
  const openEditModal = () => { setEditData(profileForm(user)); setShowEditModal(true); };

  // Board and class choices come from the admin Dropdown settings. Classes follow the chosen board.
  const [boards, setBoards] = useState([]), [classes, setClasses] = useState([]), [choicesError, setChoicesError] = useState('');
  useEffect(() => {
    if (!showEditModal) return;
    let active = true;
    collegeService.getTaxonomies('board').then(rows => { if (active) setBoards(rows); }).catch(() => { if (active) setChoicesError('Board and class choices could not be loaded. Your saved values are kept.'); });
    return () => { active = false; };
  }, [showEditModal]);
  const selectedBoardId = boards.find(b => b.label === editData.board)?.id;
  useEffect(() => {
    if (!showEditModal) return;
    let active = true;
    collegeService.getTaxonomies('class', selectedBoardId).then(rows => { if (active) setClasses(rows); }).catch(() => { if (active) setChoicesError('Board and class choices could not be loaded. Your saved values are kept.'); });
    return () => { active = false; };
  }, [showEditModal, selectedBoardId]);
  const boardOptions = withSaved(boards.map(b => b.label), editData.board);
  const classOptions = withSaved([...new Set(classes.map(c => c.label))], editData.class);

  const [savingProfile, setSavingProfile] = useState(false);
  // Password state
  const [currPass, setCurrPass] = useState("");
  const [newPass, setNewPass] = useState("");

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (editData.phone.trim() && !isPhoneNumber(editData.phone)) { showError(PHONE_HINT); return; }
    setSavingProfile(true);
    try {
      await updateProfile({ name: editData.name, phone: editData.phone.trim(), profile: { board: editData.board, class: editData.class, dob: editData.dob } });
      showSuccess("Profile updated successfully!");
      setShowEditModal(false);
    } catch (err) {
      showError(err.message || "Failed to update profile.");
    } finally { setSavingProfile(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPass || newPass.length < 6) {
      showError("New password must be at least 6 characters.");
      return;
    }
    try { await authService.changePassword(currPass, newPass); await logout(); navigate('/login'); }
    catch (error) { showError(error.message); return; }
    showSuccess("Password changed. Please sign in again.");
    setShowPasswordModal(false);
    setCurrPass("");
    setNewPass("");
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    navigate("/login");
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl w-full mx-auto space-y-3 sm:space-y-3.5 box-border">
      {/* Top Profile Card */}
      <div className="bg-white rounded-2xl border border-[#E6E8EC] p-4 sm:p-5 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-center gap-3.5 text-center sm:text-left">
          <div className="relative shrink-0">
            <img
              src={user.avatar || '/KitssLogo.png'}
              alt={user.name}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-[#0A1D3F]/10 shadow-sm"
            />
            <button
              type="button"
              onClick={openEditModal}
              className="absolute -bottom-1 -right-1 p-1 rounded-full bg-[#0A1D3F] text-white hover:bg-[#133C8B] transition shadow-xs"
              aria-label="Edit Profile"
            >
              <Edit3 className="w-3 h-3" />
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <div>
                <h1 className="text-base sm:text-lg font-extrabold text-[#0A1D3F] tracking-tight leading-tight">
                  {user.name}
                </h1>
                <p className="text-[11px] font-mono font-semibold text-[#667085]">
                  Student ID: <span className="text-[#0A1D3F] font-bold">{user.id}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={openEditModal}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#E6E8EC] bg-white text-xs font-bold text-[#0A1D3F] hover:bg-gray-50 transition active:scale-95"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mt-1.5">
              <span className="px-2 py-0.2 rounded-md text-[10px] font-bold bg-[#0A1D3F] text-white">
                {user.board}
              </span>
              <span className="px-2 py-0.2 rounded-md text-[10px] font-bold bg-[#FF8A00]/15 text-[#FF8A00]">
                {user.class}
              </span>
              <span className="text-[10px] text-[#667085] font-medium">
                {user.createdAt ? 'Joined ' + new Date(user.createdAt).toLocaleDateString('en-IN') : 'Account details'}
              </span>
            </div>
          </div>
        </div>

        {/* Student Stats Summary Bar */}
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mt-3.5 pt-3 border-t border-[#E6E8EC]">
          <div className="p-2 bg-[#F7F8FA] rounded-xl text-center">
            <div className="flex items-center justify-center gap-1 text-orange-500 font-bold text-xs sm:text-sm">
              <GraduationCap className="w-3.5 h-3.5" />
              <span aria-label={learning ? learning.courses + ' active courses' : 'Active courses unavailable'}>{stat(learning?.courses)}</span>
            </div>
            <span className="text-[9px] text-[#667085] block mt-0.5 truncate">Courses</span>
          </div>

          <div className="p-2 bg-[#F7F8FA] rounded-xl text-center">
            <div className="flex items-center justify-center gap-1 text-amber-500 font-bold text-xs sm:text-sm">
              <TrendingUp className="w-3.5 h-3.5" />
              <span aria-label={learning ? 'Average course progress ' + learning.progress + ' percent' : 'Course progress unavailable'}>{learning ? learning.progress + '%' : '—'}</span>
            </div>
            <span className="text-[9px] text-[#667085] block mt-0.5 truncate">Progress</span>
          </div>

          <div className="p-2 bg-[#F7F8FA] rounded-xl text-center">
            <div className="flex items-center justify-center gap-1 text-[#0A1D3F] font-bold text-xs sm:text-sm">
              <Video className="w-3.5 h-3.5" />
              <span aria-label={learning ? learning.lectures + ' lectures completed' : 'Lecture total unavailable'}>{stat(learning?.lectures)}</span>
            </div>
            <span className="text-[9px] text-[#667085] block mt-0.5 truncate">Lectures</span>
          </div>

          <div className="p-2 bg-[#F7F8FA] rounded-xl text-center">
            <div className="flex items-center justify-center gap-1 text-[#17B26A] font-bold text-xs sm:text-sm">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{purchasedCount || user.readBooks || 0}</span>
            </div>
            <span className="text-[9px] text-[#667085] block mt-0.5 truncate">Books</span>
          </div>
        </div>
      </div>

      {/* Account Details & Quick Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Personal Details Card */}
        <div className="bg-white rounded-2xl border border-[#E6E8EC] p-3.5 sm:p-4 shadow-xs space-y-2.5">
          <h3 className="text-xs sm:text-sm font-bold text-[#0A1D3F]">
            Student Information
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2.5 p-2.5 bg-[#F7F8FA] rounded-xl border border-[#E6E8EC]/60">
              <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[9px] text-[#667085] block leading-none mb-0.5">Email Address</span>
                <span className="font-semibold text-[#0A1D3F] truncate block text-[11px]">
                  {user.email}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 bg-[#F7F8FA] rounded-xl border border-[#E6E8EC]/60">
              <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[9px] text-[#667085] block leading-none mb-0.5">Mobile Number</span>
                <span className="font-semibold text-[#0A1D3F] text-[11px]">{user.phone || 'Not provided'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 bg-[#F7F8FA] rounded-xl border border-[#E6E8EC]/60">
              <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[9px] text-[#667085] block leading-none mb-0.5">Date of Birth</span>
                <span className="font-semibold text-[#0A1D3F] text-[11px]">{formatDob(user.dob) || 'Not provided'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Actions */}
        <div className="bg-white rounded-2xl border border-[#E6E8EC] p-3.5 sm:p-4 shadow-xs space-y-2">
          <h3 className="text-xs sm:text-sm font-bold text-[#0A1D3F]">
            Security & Shortcuts
          </h3>

          <div className="space-y-1.5">
            <Link to="/my-applications" className="block border rounded-xl p-3 font-semibold text-sm">My applications</Link>
            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className="w-full flex items-center justify-between p-2.5 bg-[#F7F8FA] hover:bg-gray-100 rounded-xl border border-[#E6E8EC] text-left transition"
            >
              <div className="flex items-center gap-2.5">
                <KeyRound className="w-3.5 h-3.5 text-[#0A1D3F]" />
                <div>
                  <h4 className="text-xs font-bold text-[#0A1D3F]">Change Password</h4>
                  <p className="text-[10px] text-[#667085]">Update security password</p>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            </button>

            <Link
              to="/coaching"
              className="w-full flex items-center justify-between p-2.5 bg-[#FFF7ED] hover:bg-[#FFEDD5] rounded-xl border border-[#FF8A00]/30 text-left transition block group cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#FF8A00]/15 flex items-center justify-center text-[#FF8A00] shrink-0">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-[#0A1D3F] group-hover:text-[#FF8A00] transition">
                      Purchase Course
                    </h4>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#FF8A00] text-white">
                      New Batches
                    </span>
                  </div>
                  <p className="text-[10px] text-[#667085]">Explore & enroll in coaching courses</p>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[#FF8A00] group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              to="/my-books"
              className="w-full flex items-center justify-between p-2.5 bg-[#FFF7ED] hover:bg-[#FFEDD5] rounded-xl border border-[#FF8A00]/30 text-left transition block group cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#FF8A00]/15 flex items-center justify-center text-[#FF8A00] shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-[#0A1D3F] group-hover:text-[#FF8A00] transition">
                      My Books
                    </h4>
                    {purchasedCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#17B26A] text-white">
                        {purchasedCount}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-[#667085]">View your purchased books</p>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[#FF8A00] group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              to="/coaching/my-courses"
              className="w-full flex items-center justify-between p-2.5 bg-[#F7F8FA] hover:bg-gray-100 rounded-xl border border-[#E6E8EC] text-left transition block"
            >
              <div className="flex items-center gap-2.5">
                <Video className="w-3.5 h-3.5 text-[#FF8A00]" />
                <div>
                  <h4 className="text-xs font-bold text-[#0A1D3F]">My courses</h4>
                  <p className="text-[10px] text-[#667085]">View & renew coaching</p>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            </Link>

            <Link
              to="/orders"
              className="w-full flex items-center justify-between p-2.5 bg-[#F7F8FA] hover:bg-gray-100 rounded-xl border border-[#E6E8EC] text-left transition block"
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-3.5 h-3.5 text-[#6C4AB6]" />
                <div>
                  <h4 className="text-xs font-bold text-[#0A1D3F]">Order History</h4>
                  <p className="text-[10px] text-[#667085]">Invoices & book purchases</p>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            </Link>

            <button
              type="button"
              onClick={() => setShowLogoutModal(true)}
              className="w-full flex items-center justify-between p-2.5 bg-red-50/60 hover:bg-red-100/60 rounded-xl border border-red-200/60 text-left transition"
            >
              <div className="flex items-center gap-2.5 text-[#D92D20]">
                <LogOut className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">Logout</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-red-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Student Profile"
      >
        <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
          <div>
            <label className="font-bold block mb-1">Full Name</label>
            <input
              type="text"
              aria-label="Profile full name" value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              className="w-full p-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs"
              required
            />
          </div>

          <div>
            <label className="font-bold block mb-1">Email Address</label>
            <input
              type="email"
              aria-label="Profile email" readOnly value={editData.email}
              onChange={(e) => setEditData({ ...editData, email: e.target.value })}
              className="w-full p-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs"
              required
            />
          </div>

          <div>
            <label htmlFor="profile-phone" className="font-bold block mb-1">Mobile Number <span className="font-normal text-[#667085]">(optional)</span></label>
            <input
              id="profile-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              maxLength={24}
              aria-label="Profile phone" value={editData.phone}
              onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
              className="w-full p-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs"
            />
          </div>

          <div>
            <label htmlFor="profile-dob" className="font-bold block mb-1">Date of Birth <span className="font-normal text-[#667085]">(optional)</span></label>
            <input
              id="profile-dob"
              type="date"
              min="1900-01-01"
              max={localToday()}
              aria-label="Profile date of birth" value={editData.dob}
              onChange={(e) => setEditData({ ...editData, dob: e.target.value })}
              className="w-full p-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs"
            />
          </div>

          {choicesError && <p role="status" className="text-[11px] text-amber-700">{choicesError}</p>}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label htmlFor="profile-board" className="font-bold block mb-1">Board</label>
              <select
                id="profile-board"
                aria-label="Profile board"
                value={editData.board}
                onChange={(e) => setEditData({ ...editData, board: e.target.value, class: "" })}
                className="w-full p-2 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs"
              >
                <option value="">Select board</option>
                {boardOptions.map(label => <option key={label} value={label}>{label}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="profile-class" className="font-bold block mb-1">Class</label>
              <select
                id="profile-class"
                aria-label="Profile class"
                value={editData.class}
                onChange={(e) => setEditData({ ...editData, class: e.target.value })}
                className="w-full p-2 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs"
              >
                <option value="">Select class</option>
                {classOptions.map(label => <option key={label} value={label}>{label}</option>)}
              </select>
            </div>
          </div>

          <div className="pt-3 flex gap-2">
            <SecondaryButton fullWidth size="sm" onClick={() => setShowEditModal(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton disabled={savingProfile} variant="navy" fullWidth size="sm" type="submit">
              {savingProfile ? "Saving..." : "Save Changes"}
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Change Password"
      >
        <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
          <div>
            <label className="font-bold block mb-1">Current Password</label>
            <input
              type="password"
              value={currPass}
              onChange={(e) => setCurrPass(e.target.value)}
              placeholder="Enter current password"
              className="w-full p-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs"
              required
            />
          </div>

          <div>
            <label className="font-bold block mb-1">New Password</label>
            <input
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full p-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs"
              required
            />
          </div>

          <div className="pt-3 flex gap-2">
            <SecondaryButton fullWidth size="sm" onClick={() => setShowPasswordModal(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton variant="orange" fullWidth size="sm" type="submit">
              Update Password
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* Logout Confirmation */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Confirm Logout"
      >
        <div className="text-center py-2 space-y-3">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-[#D92D20] mx-auto">
            <LogOut className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-[#0A1D3F]">
            Do you wish to log out from this device?
          </h4>
          <p className="text-xs text-[#667085]">
            You will need your Student User ID ({user.id}) to log back in.
          </p>
          <div className="pt-2 flex gap-2">
            <SecondaryButton fullWidth size="sm" onClick={() => setShowLogoutModal(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton variant="navy" fullWidth size="sm" onClick={handleLogout}>
              Logout
            </PrimaryButton>
          </div>
        </div>
      </Modal>
    </div>
  );
};
