import '../admin-accessibility.css';
import { useAdminAccessibility } from '../useAdminAccessibility';
import { MotionConfig } from 'framer-motion';
import React, { useState, useRef } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  GraduationCap,
  Building2,
  FileText,
  BookOpen,
  ArrowLeft,
  Menu,
  X,
  ShieldCheck,
  ExternalLink
} from "lucide-react";

import { useAuth } from '../../../user/context/AuthContext';
import { StaffInvitations } from '../StaffInvitations';
import { useDialogFocus } from '../../../../shared/ui/useDialogFocus';
export const AdminLayout = () => {
  const { user, can, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isStage4 = location.pathname === "/admin" || /^\/admin\/(users|audit-logs|operations|universities|colleges|applications|franchise-requests|taxonomies|books|content|media|settings|orders|registrations|coaching|enrollments|results|notifications)(\/|$)/.test(location.pathname);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const root = useRef(null);
  useAdminAccessibility(root,location.pathname);
  const drawer = useDialogFocus(sidebarOpen, () => setSidebarOpen(false));

  const navItems = [
    { label: "User accounts", path: "/admin/users", icon: ShieldCheck, permission: "accounts.read" },
    { label: "Audit logs", path: "/admin/audit-logs", icon: FileText, permission: "audit.read" },
    { label: "Job monitoring", path: "/admin/operations", icon: FileText, permission: "operations.read" },
    { label: "Results", path: "/admin/results", icon: FileText, permission: "results.read" },
    { label: "Notifications", path: "/admin/notifications", icon: FileText, permission: "notifications.read" },
    { label: "Coaching", path: "/admin/coaching", icon: GraduationCap, permission: "learning.read" },
    { label: "Enrollments", path: "/admin/enrollments", icon: BookOpen, permission: "learning.read" },
    { label: "Orders / Payments", path: "/admin/orders", icon: BookOpen, permission: "commerce.read" },
    { label: "Registration drafts", path: "/admin/registrations", icon: FileText, permission: "registrations.read" },
    { label: "Content", path: "/admin/content", icon: FileText, permission: "content.read" },
    { label: "Media", path: "/admin/media", icon: BookOpen, permission: "media.read" },
    { label: "Site settings", path: "/admin/settings", icon: ShieldCheck, permission: "settings.read" },
    { label: "Taxonomy", path: "/admin/taxonomies", icon: GraduationCap, permission: "content.read" },
    { label: "Dashboard", path: "/admin", icon: LayoutDashboard, exact: true, permission: "dashboard.read" },
    { label: "Universities", path: "/admin/universities", icon: GraduationCap, permission: "institutions.read" },
    { label: "Colleges / Institutes", path: "/admin/colleges", icon: Building2, permission: "institutions.read" },
    { label: "Franchise Requests", path: "/admin/franchise-requests", icon: ShieldCheck, permission: "franchises.read" },
    { label: "Admission Applications", path: "/admin/applications", icon: FileText, permission: "admissions.read" },
    { label: "Digital Books", path: "/admin/books", icon: BookOpen, permission: "learning.read" },
  ].filter(item => can(item.permission));

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  return (
    <MotionConfig reducedMotion="user"><div ref={root} className="kitss-admin min-h-screen bg-[#F7F8FA] flex flex-col">
      <a href="#admin-main" className="admin-skip-link">Skip to admin content</a>
      {/* Admin Top Header */}
      <header className="sticky top-0 z-40 bg-[#0A1D3F] text-white border-b border-[#133C8B] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Mobile hamburger & Logo */}
            <div className="flex items-center gap-3">
              <button
                aria-label="Open admin navigation"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="admin-menu-toggle p-2 rounded-xl text-white hover:bg-white/10 transition"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FF8A00] flex items-center justify-center font-extrabold text-white shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-extrabold text-sm tracking-tight text-white block leading-tight">
                    KITSS <span className="text-[#FF8A00]">ADMIN</span>
                  </span>
                  <span className="admin-header-subtitle text-[10px] text-blue-200/70 font-medium">
                    Education Franchise Management
                  </span>
                </div>
              </div>
            </div>

            <button onClick={async () => { try { await logout(); navigate("/login"); } catch { alert("Logout failed; retry when the connection is restored."); } }} className="text-xs p-2">Sign out</button>
            {/* Right: Switch to Student Portal & Admin Avatar */}
            <div className="flex items-center gap-3">
              <Link
                to="/home"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition border border-white/15"
              >
                <span>Student Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              <div className="flex items-center gap-2 pl-2 border-l border-white/15">
                <div className="w-8 h-8 rounded-full bg-[#FF8A00] text-white font-bold flex items-center justify-center text-xs shadow-xs">
                  AD
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold text-white leading-tight">{user.name}</p>
                  <p className="text-[10px] text-emerald-400">{user.roles.includes("super_admin") ? "Super Admin" : "Staff"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Body with Sidebar & Content */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        {/* Desktop Sidebar */}
        <aside className="admin-desktop-sidebar hidden lg:flex flex-col w-64 shrink-0 space-y-4">
          <div className="bg-white rounded-2xl border border-[#E6E8EC] p-3 shadow-2xs space-y-1">
            <div className="px-3 py-2 text-[10px] font-bold text-[#667085] uppercase tracking-wider">
              Navigation
            </div>
            {navItems.map((item) => {
              const active = isActive(item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? "bg-[#0A1D3F] text-white shadow-xs"
                      : "text-[#667085] hover:text-[#0A1D3F] hover:bg-gray-50"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? "text-[#FF8A00]" : ""}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Quick Info Card */}
          <div className="bg-white rounded-2xl border border-[#E6E8EC] p-4 text-xs shadow-2xs space-y-2">
            <h4 className="font-bold text-[#0A1D3F]">Franchise Quick Tip</h4>
            <p className="text-[#667085] leading-relaxed">
              Published verified institutions appear in the student directory. Inactive institutions are hidden from public listings.
            </p>
          </div>
        </aside>

        {/* Mobile Drawer Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="fixed inset-0 bg-[#0A1D3F]/60 backdrop-blur-xs"
              onClick={() => setSidebarOpen(false)}
            />
            <div ref={drawer} role="dialog" aria-modal="true" aria-label="Admin navigation" tabIndex={-1} className="relative w-64 max-w-full bg-white h-full overflow-y-auto shadow-2xl z-10 p-4 flex flex-col justify-between animate-in slide-in-from-left duration-200">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E6E8EC]">
                  <span className="font-bold text-sm text-[#0A1D3F]">Admin Menu</span>
                  <button
                    aria-label="Close admin navigation"
                    onClick={() => setSidebarOpen(false)}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-1">
                  {navItems.map((item) => {
                    const active = isActive(item);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.label}
                        to={item.path}
                  aria-current={active ? "page" : undefined}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          active
                            ? "bg-[#0A1D3F] text-white shadow-xs"
                            : "text-[#667085] hover:text-[#0A1D3F] hover:bg-gray-50"
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${active ? "text-[#FF8A00]" : ""}`} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-[#E6E8EC]">
                <Link
                  to="/home"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-2 text-xs font-bold text-[#FF8A00] p-2 hover:bg-orange-50 rounded-xl"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Student App</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Viewport */}
        <main id="admin-main" tabIndex={-1} className="flex-1 min-w-0">
          <StaffInvitations />
          {!isStage4 && <p role="status" className="mb-4 p-3 bg-amber-50 border rounded-xl text-xs text-[#0A1D3F]">Preview data only. Business management APIs are pending integration; changes are disabled.</p>}
          <fieldset disabled={!isStage4} className="min-w-0"><Outlet /></fieldset>
        </main>
      </div>
    </div></MotionConfig>
  );
};
