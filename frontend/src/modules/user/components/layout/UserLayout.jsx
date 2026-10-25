import { contentService } from '../../services/contentService';
import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { AppHeader } from "./AppHeader";
import { BottomNavigation } from "./BottomNavigation";
import { SideDrawer } from "./SideDrawer";

export const UserLayout = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const [publicSettings,setPublicSettings] = useState({}),[settingsError,setSettingsError] = useState('');
  useEffect(()=>{const controller=new AbortController();contentService.settings(controller.signal).then(setPublicSettings).catch(e=>{if(e.code!=='ABORTED')setSettingsError(e.message);});return()=>controller.abort();},[]);

  // Immersive reader pages (e.g. /books/:id/read or /coaching/.../read) should have 100% of screen without standard navigation bars
  const isImmersiveReader = location.pathname.includes("/read") || /^\/coaching\/[^/]+\/book\/[^/]+$/.test(location.pathname);
  const isNotificationsPage = location.pathname.startsWith("/notifications");

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
      {/* App Header (Sticky) - hidden on notifications page as requested */}
      {!isNotificationsPage && (
        <AppHeader onOpenDrawer={() => setDrawerOpen(true)} brand={publicSettings.brand} />
      )}

      {/* Mobile Slide Drawer */}
      <SideDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} support={publicSettings.support} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-5 pb-28 md:pb-12 min-w-0 overflow-x-hidden">
        <Outlet />
      </main>

      {settingsError && <p role="status" className="text-xs text-amber-700 px-4">Public contact information is temporarily unavailable.</p>}
      {publicSettings.support && <address className="not-italic text-xs text-[#667085] px-4 py-2 text-center">{publicSettings.support.email && <a href={'mailto:'+publicSettings.support.email}>{publicSettings.support.email}</a>} {publicSettings.support.phone} {publicSettings.support.address} {publicSettings.support.hours}</address>}
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
                <span className="font-extrabold text-[#0A1D3F] text-base tracking-tight min-w-0 break-words [overflow-wrap:anywhere]">
                  {publicSettings.brand?.name || <>KITSS <span className="text-[#FF8A00]">EDUCATION</span></>}
                </span>
              </div>
              <p className="text-xs text-[#667085] leading-relaxed">
                {publicSettings.footer?.description || "Published platform information is being prepared."}
              </p>
              <p className="text-xs font-semibold text-[#FF8A00]">
                {publicSettings.brand?.tagline || "KITSS Education"}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#0A1D3F] uppercase tracking-wider mb-3">
                Digital Books
              </h4>
              <ul className="space-y-2 text-xs text-[#667085]">
                <li><Link to="/books" className="hover:text-[#FF8A00]">Browse published books</Link></li>
                <li><Link to="/my-books" className="hover:text-[#FF8A00]">My purchased books</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#0A1D3F] uppercase tracking-wider mb-3">
                Online Coaching
              </h4>
              <ul className="space-y-2 text-xs text-[#667085]">
                <li><Link to="/coaching" className="hover:text-[#FF8A00]">Browse published courses</Link></li>
                <li><Link to="/coaching/select?choose=1" className="hover:text-[#FF8A00]">Choose course filters</Link></li>
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
                <li><Link to="/orders" className="hover:text-[#FF8A00]">Orders & Receipts</Link></li>
                <li><Link to="/settings" className="hover:text-[#FF8A00]">Security & Settings</Link></li>
                <li className="text-xs text-[#0A1D3F] font-semibold pt-1">
                  {publicSettings.support?.phone || "Support phone not configured"}
                </li>
              </ul>
            </div>
          </div>

          {publicSettings.footer?.links?.length > 0 && <nav aria-label="Published footer links" className="flex flex-wrap gap-4 mt-5 text-xs">{publicSettings.footer.links.map((link, index) => link.type === 'internal' ? <Link key={index} to={link.target} className="underline break-all">{link.target}</Link> : <a key={index} href={link.target} target="_blank" rel="noopener noreferrer" className="underline break-all">{link.target}</a>)}</nav>}

          <div className="border-t border-[#E6E8EC] mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#667085]">
            <p>{publicSettings.footer?.copyright || <>© {new Date().getFullYear()} KITSS EDUCATION. All Rights Reserved.</>}</p>
            <p className="mt-2 sm:mt-0">Single Device Secure Student Platform</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
