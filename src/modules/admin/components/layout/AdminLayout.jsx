import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  FileText,
  ArrowLeft,
  Menu,
  X,
  ShieldCheck,
  ExternalLink
} from "lucide-react";

export const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", path: "/admin", icon: LayoutDashboard, exact: true },
    { label: "Partner Colleges", path: "/admin/colleges", icon: Building2 },
    { label: "Admission Applications", path: "/admin/applications", icon: FileText },
  ];

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col">
      {/* Admin Top Header */}
      <header className="sticky top-0 z-40 bg-[#0A1D3F] text-white border-b border-[#133C8B] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Mobile hamburger & Logo */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 rounded-xl text-white hover:bg-white/10 transition"
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
                  <span className="text-[10px] text-blue-200/70 font-medium">
                    Education Franchise Management
                  </span>
                </div>
              </div>
            </div>

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
                  <p className="text-xs font-bold text-white leading-tight">Administrator</p>
                  <p className="text-[10px] text-emerald-400">Super Admin</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Body with Sidebar & Content */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 shrink-0 space-y-4">
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
              Active colleges immediately show up on the Student Home page under "Find Your College". Inactive colleges are hidden from students.
            </p>
          </div>
        </aside>

        {/* Mobile Drawer Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div
              className="fixed inset-0 bg-[#0A1D3F]/60 backdrop-blur-xs"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="relative w-64 bg-white h-full shadow-2xl z-10 p-4 flex flex-col justify-between animate-in slide-in-from-left duration-200">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E6E8EC]">
                  <span className="font-bold text-sm text-[#0A1D3F]">Admin Menu</span>
                  <button
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
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
