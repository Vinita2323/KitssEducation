import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { AppHeader } from "./AppHeader";
import { BottomNavigation } from "./BottomNavigation";
import { SideDrawer } from "./SideDrawer";

export const UserLayout = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  // Immersive reader pages (e.g. /books/:id/read or /coaching/.../read) should have 100% of screen without standard navigation bars
  const isImmersiveReader = location.pathname.includes("/read");

  if (isImmersiveReader) {
    return (
      <div className="h-screen w-full max-w-full overflow-hidden bg-[#F1F3F7] flex flex-col font-sans text-slate-900 antialiased select-none">
        <main className="flex-1 w-full h-full min-w-0 overflow-hidden flex flex-col">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900 antialiased selection:bg-slate-900 selection:text-white w-full max-w-full overflow-x-hidden">
      {/* App Header (Sticky) */}
      <AppHeader onOpenDrawer={() => setDrawerOpen(true)} unreadCount={2} />

      {/* Mobile Slide Drawer */}
      <SideDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-5 pb-28 md:pb-12 min-w-0 overflow-x-hidden">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation (Visible only < 768px) */}
      <BottomNavigation />

      {/* Desktop & Tablet Footer */}
      <footer className="hidden md:block bg-white border-t border-[#E6E8EC] py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <img
                  src="/KitssLogo.png"
                  alt="KITSS Logo"
                  className="h-9 w-auto object-contain"
                />
                <span className="font-extrabold text-[#0A1D3F] text-base tracking-tight">
                  KITSS <span className="text-[#FF8A00]">EDUCATION</span>
                </span>
              </div>
              <p className="text-xs text-[#667085] leading-relaxed">
                Empowering students across India with digital books, interactive online coaching, and seamless examination results.
              </p>
              <p className="text-xs font-semibold text-[#FF8A00]">
                "Learn Today, Lead Tomorrow"
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#0A1D3F] uppercase tracking-wider mb-3">
                Digital Books
              </h4>
              <ul className="space-y-2 text-xs text-[#667085]">
                <li><Link to="/books?board=CBSE" className="hover:text-[#FF8A00]">CBSE Board Books</Link></li>
                <li><Link to="/books?board=ICSE" className="hover:text-[#FF8A00]">ICSE Board Books</Link></li>
                <li><Link to="/books?board=NCERT" className="hover:text-[#FF8A00]">NCERT Solutions</Link></li>
                <li><Link to="/books?board=State+Board" className="hover:text-[#FF8A00]">State Board Resources</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#0A1D3F] uppercase tracking-wider mb-3">
                Online Coaching
              </h4>
              <ul className="space-y-2 text-xs text-[#667085]">
                <li><Link to="/coaching?category=CBSE" className="hover:text-[#FF8A00]">CBSE Classes 9–12</Link></li>
                <li><Link to="/coaching?category=JEE" className="hover:text-[#FF8A00]">JEE Main & Advanced</Link></li>
                <li><Link to="/coaching?category=NEET" className="hover:text-[#FF8A00]">NEET Medical Prep</Link></li>
                <li><Link to="/subscriptions" className="hover:text-[#FF8A00]">Active Subscriptions</Link></li>
                <li><Link to="/results" className="hover:text-[#FF8A00]">Board Exam Results</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#0A1D3F] uppercase tracking-wider mb-3">
                Student Support
              </h4>
              <ul className="space-y-2 text-xs text-[#667085]">
                <li><Link to="/profile" className="hover:text-[#FF8A00]">Student Account</Link></li>
                <li><Link to="/orders" className="hover:text-[#FF8A00]">Orders & Invoices</Link></li>
                <li><Link to="/settings" className="hover:text-[#FF8A00]">Security & Settings</Link></li>
                <li className="text-xs text-[#0A1D3F] font-semibold pt-1">
                  Helpline: +91 1800 123 4567
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[#E6E8EC] mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#667085]">
            <p>© {new Date().getFullYear()} KITSS EDUCATION. All Rights Reserved.</p>
            <p className="mt-2 sm:mt-0">Single Device Secure Student Platform</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
