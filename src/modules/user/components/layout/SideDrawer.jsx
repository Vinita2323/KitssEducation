import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  X,
  Home,
  BookOpen,
  Library,
  Video,
  ShieldCheck,
  FileCheck,
  ShoppingBag,
  Bell,
  User,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Modal } from "../common/Modal";
import { PrimaryButton, SecondaryButton } from "../common/PrimaryButton";

export const SideDrawer = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  if (!isOpen) return null;

  const menuItems = [
    { label: "Home", path: "/home", icon: Home },
    { label: "Digital Books", path: "/books", icon: BookOpen },
    { label: "My Library", path: "/library", icon: Library },
    { label: "Online Coaching", path: "/coaching", icon: Video },
    { label: "My Subscriptions", path: "/subscriptions", icon: ShieldCheck },
    { label: "Examination Results", path: "/results", icon: FileCheck },
    { label: "My Orders", path: "/orders", icon: ShoppingBag },
    { label: "Notifications", path: "/notifications", icon: Bell },
    { label: "Student Profile", path: "/profile", icon: User },
    { label: "Settings", path: "/settings", icon: Settings },
  ];

  const handleLinkClick = (path) => {
    onClose();
    navigate(path);
  };

  const handleConfirmLogout = async () => {
    setShowLogoutModal(false);
    onClose();
    await logout();
    navigate("/login");
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-[#0A1D3F]/60 backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />

        {/* Drawer Panel */}
        <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl z-10 flex flex-col justify-between animate-in slide-in-from-left duration-300">
          {/* Top Header & Student Info */}
          <div>
            <div className="flex items-center justify-between p-4 border-b border-[#E6E8EC]">
              <div className="flex items-center gap-2">
                <img
                  src="/KitssLogo.png"
                  alt="KITSS Logo"
                  className="h-8 w-auto object-contain"
                />
                <span className="font-extrabold text-[#0A1D3F] text-sm tracking-tight">
                  KITSS <span className="text-[#FF8A00]">EDUCATION</span>
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student Profile Card in Drawer */}
            {user ? (
              <div className="p-4 bg-[#F7F8FA] border-b border-[#E6E8EC]">
                <div className="flex items-center gap-3">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-[#0A1D3F] truncate">
                      {user.name}
                    </h4>
                    <p className="text-xs text-[#667085] truncate font-mono">
                      {user.id}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#0A1D3F] text-white">
                        {user.board}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#FF8A00]/15 text-[#FF8A00]">
                        {user.class}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-[#F7F8FA] border-b border-[#E6E8EC]">
                <PrimaryButton
                  fullWidth
                  size="sm"
                  onClick={() => handleLinkClick("/login")}
                >
                  Login / Register
                </PrimaryButton>
              </div>
            )}

            {/* Menu List */}
            <div className="p-2 overflow-y-auto max-h-[calc(100vh-280px)] space-y-0.5">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;

                return (
                  <button
                    key={item.label}
                    onClick={() => handleLinkClick(item.path)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                      isActive
                        ? "bg-[#0A1D3F] text-white shadow-xs"
                        : "text-[#0A1D3F] hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 ${
                          isActive ? "text-white" : "text-[#667085]"
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight
                      className={`w-3.5 h-3.5 ${
                        isActive ? "text-white/60" : "text-gray-300"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Actions: Help & Logout */}
          <div className="p-3 border-t border-[#E6E8EC] bg-white space-y-1">
            <button
              onClick={() => setShowHelpModal(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#667085] hover:text-[#0A1D3F] hover:bg-gray-50 rounded-xl transition"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Help & Student Support</span>
            </button>

            {user && (
              <button
                onClick={() => setShowLogoutModal(true)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[#D92D20] hover:bg-red-50 rounded-xl transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Confirm Logout"
      >
        <div className="text-center py-2">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-[#D92D20] mx-auto mb-3">
            <LogOut className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-[#0A1D3F] mb-1">
            Are you sure you want to logout?
          </h4>
          <p className="text-xs text-[#667085] mb-5">
            You will need to login again with your Student User ID and Password.
          </p>
          <div className="flex gap-2.5">
            <SecondaryButton
              fullWidth
              size="md"
              onClick={() => setShowLogoutModal(false)}
            >
              Cancel
            </SecondaryButton>
            <PrimaryButton
              variant="navy"
              fullWidth
              size="md"
              onClick={handleConfirmLogout}
            >
              Yes, Logout
            </PrimaryButton>
          </div>
        </div>
      </Modal>

      {/* Help Modal */}
      <Modal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        title="Student Help & Support"
      >
        <div className="space-y-3.5 text-xs text-[#0A1D3F]">
          <div className="p-3 bg-[#F7F8FA] rounded-xl border border-[#E6E8EC]">
            <p className="font-bold text-sm text-[#0A1D3F]">Need Assistance?</p>
            <p className="text-gray-500 mt-1">
              Contact our student academic cell for questions regarding books, coaching subscriptions, or exam results.
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2.5 rounded-lg border border-[#E6E8EC]">
              <span className="text-gray-500">Student Helpline:</span>
              <span className="font-bold">+91 1800 123 4567</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg border border-[#E6E8EC]">
              <span className="text-gray-500">Email Support:</span>
              <span className="font-bold">support@kitseducation.com</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg border border-[#E6E8EC]">
              <span className="text-gray-500">Hours:</span>
              <span className="font-bold">Mon - Sat (9 AM - 7 PM)</span>
            </div>
          </div>
          <PrimaryButton
            fullWidth
            size="sm"
            onClick={() => setShowHelpModal(false)}
          >
            Close
          </PrimaryButton>
        </div>
      </Modal>
    </>
  );
};
