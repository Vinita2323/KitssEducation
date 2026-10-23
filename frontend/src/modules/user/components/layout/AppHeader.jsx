import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Bell, Search, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const AppHeader = ({ unreadCount = 2 }) => {
  const location = useLocation();
  const { user } = useAuth();

  const navLinks = [
    { name: "Home", path: "/home" },
    { name: "Categories", path: "/categories" },
    { name: "Institutes", path: "/institutes" },
    { name: "Colleges", path: "/colleges" },
    { name: "Registration", path: "/register" },
    { name: "Books", path: "/books" },
    { name: "Coaching", path: "/coaching" },
    { name: "Results", path: "/results" },
    { name: "My Orders", path: "/orders" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 sm:h-16">
          {/* Left: Brand Logo */}
          <div className="flex items-center">
            <Link to="/home" className="flex items-center gap-2 py-1 select-none group">
              <img
                src="/KitssLogo.png"
                alt="KITSS EDUCATION"
                className="h-8 sm:h-9 w-auto object-contain shrink-0 group-hover:scale-105 transition-transform duration-200"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
              <div className="flex items-center gap-1 leading-none">
                <span className="font-extrabold text-[#0A1D3F] text-xs sm:text-sm tracking-tight">
                  KITSS
                </span>
                <span className="font-extrabold text-[#FF8A00] text-xs sm:text-sm tracking-tight">
                  EDUCATION
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive =
                location.pathname === link.path ||
                (link.path !== "/home" && location.pathname.startsWith(link.path));
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right: Actions (Search, Notification & Profile) */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            {/* Mobile Quick Search Button */}
            <motion.div whileTap={{ scale: 0.9 }}>
              <Link
                to="/books"
                className="w-8 h-8 rounded-full text-slate-700 hover:bg-slate-100 transition lg:hidden flex items-center justify-center cursor-pointer"
                aria-label="Search"
              >
                <Search className="w-5 h-5 text-slate-700 stroke-[2]" />
              </Link>
            </motion.div>

            {/* Desktop Search Shortcut */}
            <Link
              to="/books"
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-500 hover:border-slate-300 transition mr-1"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search books & courses...</span>
            </Link>

            {/* Notification Bell */}
            <motion.div whileTap={{ scale: 0.9 }}>
              <Link
                to="/notifications"
                className="relative w-8 h-8 rounded-full text-slate-700 hover:bg-slate-100 transition flex items-center justify-center cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 stroke-[2] text-[#0A1D3F]" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FF8A00] rounded-full ring-1.5 ring-white animate-pulse" />
                )}
              </Link>
            </motion.div>

            {/* User Profile Picture Button */}
            <motion.div whileTap={{ scale: 0.92 }}>
              <Link
                to="/profile"
                className="flex items-center p-0.5 rounded-full hover:bg-slate-100 transition-all cursor-pointer group"
                aria-label="User Profile"
                title={user?.name || "Student Profile"}
              >
                <div className="relative w-8 h-8 rounded-full overflow-hidden ring-1.5 ring-slate-200 group-hover:ring-[#FF8A00] transition-all bg-slate-100 flex items-center justify-center shrink-0">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name || "Student Profile"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";
                      }}
                    />
                  ) : (
                    <User className="w-4 h-4 text-[#0A1D3F]" />
                  )}
                  {/* Active online dot */}
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1.5 ring-white" />
                </div>
                <div className="hidden xl:block text-left min-w-0 pl-1.5 pr-1">
                  <span className="block text-[11px] font-extrabold text-[#0A1D3F] group-hover:text-[#FF8A00] transition-colors leading-tight truncate max-w-[80px]">
                    {user?.name ? user.name.split(" ")[0] : "Profile"}
                  </span>
                  <span className="block text-[9px] font-semibold text-slate-400 leading-none truncate">
                    {user?.class || "Student"}
                  </span>
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </header>
  );
};
