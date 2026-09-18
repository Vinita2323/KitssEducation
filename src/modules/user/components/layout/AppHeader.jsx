import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Bell, Search } from "lucide-react";

export const AppHeader = ({ unreadCount = 2 }) => {
  const location = useLocation();

  const navLinks = [
    { name: "Home", path: "/home" },
    { name: "Colleges", path: "/colleges" },
    { name: "Books", path: "/books" },
    { name: "Online Coaching", path: "/coaching" },
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

          {/* Right: Actions (Search & Notification) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Mobile Quick Search Button */}
            <motion.div whileTap={{ scale: 0.9 }}>
              <Link
                to="/books"
                className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition lg:hidden touch-target flex items-center justify-center cursor-pointer"
                aria-label="Search"
              >
                <Search className="w-5 h-5 text-slate-700 stroke-[2]" />
              </Link>
            </motion.div>

            {/* Desktop Search Shortcut */}
            <Link
              to="/books"
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-500 hover:border-slate-300 transition"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search books & courses...</span>
            </Link>

            {/* Notification Bell */}
            <motion.div whileTap={{ scale: 0.9 }}>
              <Link
                to="/notifications"
                className="relative p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition touch-target flex items-center justify-center cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 stroke-[2] text-[#0A1D3F]" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-[#FF8A00] rounded-full ring-2 ring-white animate-pulse" />
                )}
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </header>
  );
};
