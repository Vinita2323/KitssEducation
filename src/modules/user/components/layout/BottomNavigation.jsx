import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Video, ShieldCheck, User } from "lucide-react";

export const BottomNavigation = () => {
  const location = useLocation();

  const navItems = [
    { label: "Home", path: "/home", icon: Home },
    { label: "Coaching", path: "/coaching", icon: Video },
    { label: "Subscriptions", path: "/subscriptions", icon: ShieldCheck },
    { label: "Profile", path: "/profile", icon: User }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-t border-slate-200/80 px-2 py-1.5 shadow-[0_-2px_12px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== "/home" && location.pathname.startsWith(item.path));
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-150 touch-target ${
                isActive
                  ? "text-slate-950 font-semibold bg-slate-100/70"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon
                className={`w-4.5 h-4.5 transition-transform ${
                  isActive ? "stroke-[2.2] scale-105 text-slate-950" : "stroke-[1.6]"
                }`}
              />
              <span
                className={`text-[10px] mt-0.5 tracking-tight ${
                  isActive ? "font-semibold text-slate-950" : "font-medium text-slate-500"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
