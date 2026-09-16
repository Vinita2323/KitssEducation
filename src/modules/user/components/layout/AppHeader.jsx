import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Bell,
  Search,
  BookOpen,
  Video,
  FileCheck,
  Library,
  ShoppingBag,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Shield
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const AppHeader = ({ onOpenDrawer, unreadCount = 2 }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const navLinks = [
    { name: "Home", path: "/home" },
    { name: "Colleges", path: "/colleges" },
    { name: "Books", path: "/books" },
    { name: "Online Coaching", path: "/coaching" },
    { name: "My Library", path: "/library" },
    { name: "Results", path: "/results" },
    { name: "My Orders", path: "/orders" },
  ];

  const handleLogout = async () => {
    setProfileDropdownOpen(false);
    await logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E6E8EC] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 sm:h-20">
          {/* Left: Brand Logo */}
          <div className="flex items-center">
            <Link to="/home" className="flex items-center py-1">
              <img
                src="/KitssLogo.png"
                alt="KITSS EDUCATION"
                className="h-14 sm:h-16 md:h-18 w-auto object-contain transition hover:opacity-95"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            </Link>
          </div>

          {/* Center: Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path || (link.path !== "/home" && location.pathname.startsWith(link.path));
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-[#0A1D3F] text-white shadow-xs"
                      : "text-[#667085] hover:text-[#0A1D3F] hover:bg-gray-50"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right: Actions (Search, Notification, Profile) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Desktop Search Shortcut */}
            <Link
              to="/books"
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs text-[#667085] hover:border-gray-300 transition"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search books & courses...</span>
            </Link>

            {/* Notification Bell */}
            <Link
              to="/notifications"
              className="relative p-2.5 rounded-xl text-[#0A1D3F] hover:bg-gray-100 transition active:scale-95"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#FF8A00] text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Link>

            {/* User Profile dropdown */}
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-50 border border-transparent hover:border-[#E6E8EC] transition"
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover border border-[#E6E8EC]"
                  />
                  <div className="hidden lg:flex flex-col text-left">
                    <span className="text-xs font-bold text-[#0A1D3F] leading-tight">
                      {user.name.split(" ")[0]}
                    </span>
                    <span className="text-[10px] text-[#667085] leading-tight">
                      {user.class}
                    </span>
                  </div>
                  <ChevronDown className="hidden lg:block w-3.5 h-3.5 text-gray-400" />
                </button>

                {profileDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setProfileDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#E6E8EC] p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-2.5 border-b border-[#E6E8EC] mb-1">
                        <p className="text-xs font-bold text-[#0A1D3F]">{user.name}</p>
                        <p className="text-[11px] text-[#667085]">{user.id}</p>
                        <p className="text-[11px] font-semibold text-[#FF8A00] mt-0.5">
                          {user.board} • {user.class}
                        </p>
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#0A1D3F] rounded-xl hover:bg-gray-50 transition"
                      >
                        <User className="w-4 h-4 text-[#667085]" />
                        <span>My Profile</span>
                      </Link>

                      <Link
                        to="/subscriptions"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#0A1D3F] rounded-xl hover:bg-gray-50 transition"
                      >
                        <Video className="w-4 h-4 text-[#667085]" />
                        <span>My Subscriptions</span>
                      </Link>

                      <Link
                        to="/orders"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#0A1D3F] rounded-xl hover:bg-gray-50 transition"
                      >
                        <ShoppingBag className="w-4 h-4 text-[#667085]" />
                        <span>My Orders</span>
                      </Link>

                      <Link
                        to="/settings"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#0A1D3F] rounded-xl hover:bg-gray-50 transition"
                      >
                        <Settings className="w-4 h-4 text-[#667085]" />
                        <span>Settings</span>
                      </Link>

                      <Link
                        to="/admin"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[#FF8A00] bg-orange-50/70 rounded-xl hover:bg-orange-100/70 transition"
                      >
                        <Shield className="w-4 h-4 text-[#FF8A00]" />
                        <span>Admin Portal</span>
                      </Link>

                      <div className="border-t border-[#E6E8EC] my-1" />

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#D92D20] rounded-xl hover:bg-red-50 transition"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-[#0A1D3F] hover:bg-[#133C8B] text-white text-xs font-bold rounded-xl transition"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
