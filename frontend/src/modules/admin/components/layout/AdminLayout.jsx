import '../admin-accessibility.css';
import '../admin-workspace.css';
import '../admin-design.css';
import { useAdminAccessibility } from '../useAdminAccessibility';
import { MotionConfig } from 'framer-motion';
import React, { useState, useRef, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Menu,
  X,
  ShieldCheck,
  ExternalLink,
  LogOut
} from "lucide-react";

import { useAuth } from '../../../user/context/AuthContext';

import { AdminNavigation } from './AdminNavigation';
import { AdminPageGuide } from './AdminPageGuide';
import { useDialogFocus } from '../../../../shared/ui/useDialogFocus';
export const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isStage4 = location.pathname === "/admin" || /^\/admin\/(staff|refunds|access-requests|users|audit-logs|operations|universities|colleges|applications|franchise-requests|taxonomies|books|content|media|settings|orders|registrations|coaching|enrollments|results|notifications)(\/|$)/.test(location.pathname);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const root = useRef(null);
  const content = useRef(null);
  useEffect(() => { content.current?.scrollTo(0, 0); }, [location.pathname]);
  useAdminAccessibility(root,location.pathname);
  const drawer = useDialogFocus(sidebarOpen, () => setSidebarOpen(false));
  const initials = (user?.name || 'Admin').trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();

  useEffect(() => {
    const wide = window.matchMedia('(min-width: 1024px)');
    const closeOnDesktop = () => { if (wide.matches) setSidebarOpen(false); };
    wide.addEventListener('change', closeOnDesktop);
    return () => wide.removeEventListener('change', closeOnDesktop);
  }, []);

  return (
    <MotionConfig reducedMotion="user"><div ref={root} className="kitss-admin h-dvh overflow-hidden bg-[#F7F8FA] flex flex-col">
      <a href="#admin-main" className="admin-skip-link">Skip to admin content</a>
      {/* Admin Top Header */}
      <header className="admin-topbar shrink-0 z-40 bg-[#0A1D3F] text-white border-b border-[#133C8B] shadow-sm">
        <div className="px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Left: Mobile hamburger & Logo */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label={desktopSidebarOpen ? 'Collapse admin sidebar' : 'Expand admin sidebar'}
                title={desktopSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                aria-expanded={desktopSidebarOpen}
                aria-controls="admin-desktop-sidebar"
                onClick={() => setDesktopSidebarOpen(open => !open)}
                className="hidden lg:inline-flex items-center justify-center p-2 rounded-xl text-white hover:bg-white/10 transition"
              >
                {desktopSidebarOpen ? <X aria-hidden="true" className="w-5 h-5" /> : <Menu aria-hidden="true" className="w-5 h-5" />}
              </button>
              <button
                aria-label="Open admin navigation"
                aria-expanded={sidebarOpen}
                aria-controls={sidebarOpen ? 'admin-navigation-drawer' : undefined}
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="admin-menu-toggle p-2 rounded-xl text-white hover:bg-white/10 transition"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <div className="flex items-center gap-2.5">
                <div className="admin-brand-mark w-9 h-9 rounded-xl bg-[#FF8A00] flex items-center justify-center font-extrabold text-white shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-extrabold text-sm tracking-tight text-white block leading-tight">
                    KITSS <span className="text-[#FF8A00]">ADMIN</span>
                  </span>
                  <span className="admin-header-subtitle text-[10px] text-blue-200/70 font-medium">
                    Education management workspace
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Student Portal, admin identity and sign out */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                to="/home"
                className="admin-header-link hidden sm:inline-flex"
              >
                <span>Student Portal</span>
                <ExternalLink aria-hidden="true" className="w-3.5 h-3.5" />
              </Link>

              <div className="admin-user-chip">
                <div className="admin-avatar" aria-hidden="true">{initials}</div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold text-white leading-tight">{user.name}</p>
                  <p className="text-[10px] text-emerald-400">{user.roles.includes("super_admin") ? "Super Admin" : "Staff"}</p>
                </div>
              </div>
              <button type="button" onClick={async () => { try { await logout(); navigate("/admin/login"); } catch { alert("Logout failed; retry when the connection is restored."); } }} className="admin-header-button"><LogOut aria-hidden="true" className="w-4 h-4" /><span>Sign out</span></button>
            </div>
          </div>
        </div>
      </header>

      {/* Body with Sidebar & Content */}
      <div className="flex-1 flex min-h-0 w-full">
        {/* Desktop Sidebar */}
        <aside id="admin-desktop-sidebar" aria-label="Admin sidebar" style={desktopSidebarOpen ? undefined : { display: 'none' }} className="admin-desktop-sidebar hidden lg:flex flex-col w-72 shrink-0 min-h-0 overflow-y-auto overscroll-contain border-r border-[#E6E8EC] bg-white p-4">
          <p className="admin-sidebar-label">Workspace</p>
          <AdminNavigation />
        </aside>

        {/* Mobile Drawer Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="fixed inset-0 bg-[#0A1D3F]/60 backdrop-blur-xs"
              onClick={() => setSidebarOpen(false)}
            />
            <div id="admin-navigation-drawer" ref={drawer} role="dialog" aria-modal="true" aria-label="Admin navigation" tabIndex={-1} className="admin-navigation-drawer relative w-80 max-w-[90vw] bg-white h-full overflow-y-auto shadow-2xl z-10 p-4 flex flex-col justify-between animate-in slide-in-from-left duration-200">
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

                <AdminNavigation mobile onNavigate={() => setSidebarOpen(false)} />
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
        <main ref={content} id="admin-main" tabIndex={-1} className="flex-1 min-w-0 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:p-8">
          <AdminPageGuide />
          {!isStage4 && <p role="status" className="mb-4 p-3 bg-amber-50 border rounded-xl text-xs text-[#0A1D3F]">This section is not available yet. Changes cannot be saved here.</p>}
          <fieldset disabled={!isStage4} className="min-w-0"><Outlet /></fieldset>
        </main>
      </div>
    </div></MotionConfig>
  );
};
