import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  Calendar,
  GraduationCap,
  Shield,
  KeyRound,
  ShoppingBag,
  Video,
  HelpCircle,
  LogOut,
  ChevronRight,
  Flame,
  Coins,
  BookOpen,
  Award,
  Edit3
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { Modal } from "../../components/common/Modal";
import { PrimaryButton, SecondaryButton } from "../../components/common/PrimaryButton";

export const ProfilePage = () => {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Edit form state
  const [editData, setEditData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    board: user?.board || "CBSE",
    class: user?.class || "Class 10"
  });

  // Password state
  const [currPass, setCurrPass] = useState("");
  const [newPass, setNewPass] = useState("");

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(editData);
      showSuccess("Profile updated successfully!");
      setShowEditModal(false);
    } catch (err) {
      showError("Failed to update profile.");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPass || newPass.length < 6) {
      showError("New password must be at least 6 characters.");
      return;
    }
    showSuccess("Password changed successfully!");
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
              src={user.avatar}
              alt={user.name}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-[#0A1D3F]/10 shadow-sm"
            />
            <button
              type="button"
              onClick={() => setShowEditModal(true)}
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
                onClick={() => setShowEditModal(true)}
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
                Joined {user.joinDate}
              </span>
            </div>
          </div>
        </div>

        {/* Student Stats Summary Bar */}
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mt-3.5 pt-3 border-t border-[#E6E8EC]">
          <div className="p-2 bg-[#F7F8FA] rounded-xl text-center">
            <div className="flex items-center justify-center gap-1 text-orange-500 font-bold text-xs sm:text-sm">
              <Flame className="w-3.5 h-3.5 fill-orange-500" />
              <span>{user.streakDays}d</span>
            </div>
            <span className="text-[9px] text-[#667085] block mt-0.5 truncate">Streak</span>
          </div>

          <div className="p-2 bg-[#F7F8FA] rounded-xl text-center">
            <div className="flex items-center justify-center gap-1 text-amber-500 font-bold text-xs sm:text-sm">
              <Coins className="w-3.5 h-3.5 fill-amber-400" />
              <span>{user.coins}</span>
            </div>
            <span className="text-[9px] text-[#667085] block mt-0.5 truncate">Coins</span>
          </div>

          <div className="p-2 bg-[#F7F8FA] rounded-xl text-center">
            <div className="flex items-center justify-center gap-1 text-[#0A1D3F] font-bold text-xs sm:text-sm">
              <Video className="w-3.5 h-3.5" />
              <span>{user.completedLectures}</span>
            </div>
            <span className="text-[9px] text-[#667085] block mt-0.5 truncate">Lectures</span>
          </div>

          <div className="p-2 bg-[#F7F8FA] rounded-xl text-center">
            <div className="flex items-center justify-center gap-1 text-[#17B26A] font-bold text-xs sm:text-sm">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{user.readBooks}</span>
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
                <span className="font-semibold text-[#0A1D3F] text-[11px]">{user.phone}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 bg-[#F7F8FA] rounded-xl border border-[#E6E8EC]/60">
              <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[9px] text-[#667085] block leading-none mb-0.5">Date of Birth</span>
                <span className="font-semibold text-[#0A1D3F] text-[11px]">{user.dob}</span>
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
              to="/subscriptions"
              className="w-full flex items-center justify-between p-2.5 bg-[#F7F8FA] hover:bg-gray-100 rounded-xl border border-[#E6E8EC] text-left transition block"
            >
              <div className="flex items-center gap-2.5">
                <Video className="w-3.5 h-3.5 text-[#FF8A00]" />
                <div>
                  <h4 className="text-xs font-bold text-[#0A1D3F]">My Subscriptions</h4>
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
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              className="w-full p-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs"
              required
            />
          </div>

          <div>
            <label className="font-bold block mb-1">Email Address</label>
            <input
              type="email"
              value={editData.email}
              onChange={(e) => setEditData({ ...editData, email: e.target.value })}
              className="w-full p-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs"
              required
            />
          </div>

          <div>
            <label className="font-bold block mb-1">Mobile Number</label>
            <input
              type="tel"
              value={editData.phone}
              onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
              className="w-full p-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="font-bold block mb-1">Board</label>
              <select
                value={editData.board}
                onChange={(e) => setEditData({ ...editData, board: e.target.value })}
                className="w-full p-2 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs"
              >
                <option value="CBSE">CBSE</option>
                <option value="ICSE">ICSE</option>
                <option value="State Board">State Board</option>
                <option value="NCERT">NCERT</option>
              </select>
            </div>

            <div>
              <label className="font-bold block mb-1">Class</label>
              <select
                value={editData.class}
                onChange={(e) => setEditData({ ...editData, class: e.target.value })}
                className="w-full p-2 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs"
              >
                <option value="Class 9">Class 9</option>
                <option value="Class 10">Class 10</option>
                <option value="Class 11">Class 11</option>
                <option value="Class 12">Class 12</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex gap-2">
            <SecondaryButton fullWidth size="sm" onClick={() => setShowEditModal(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton variant="navy" fullWidth size="sm" type="submit">
              Save Changes
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
