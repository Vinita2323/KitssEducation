import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, BookOpen, Video, ShieldCheck, User } from "lucide-react";

export const BottomNavigation = () => {
  const location = useLocation();

  const navItems = [
    { label: "Home", path: "/home", icon: Home },
    { label: "Library", path: "/library", icon: BookOpen },
    { label: "Coaching", path: "/coaching", icon: Video },
    { label: "Subscriptions", path: "/subscriptions", icon: ShieldCheck },
    { label: "Profile", path: "/profile", icon: User }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E6E8EC] px-2 py-1.5 shadow-lg">
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
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 touch-target relative ${
                isActive
                  ? "text-[#FF8A00]"
                  : "text-[#667085] hover:text-[#0A1D3F]"
              }`}
            >
              {isActive && (
                <span className="absolute -top-1.5 w-6 h-1 bg-[#FF8A00] rounded-full" />
              )}
              <Icon
                className={`w-5 h-5 transition-transform ${
                  isActive ? "scale-110 stroke-[2.2]" : "stroke-[1.7]"
                }`}
              />
              <span
                className={`text-[11px] mt-1 tracking-tight font-medium ${
                  isActive ? "font-bold text-[#0A1D3F]" : ""
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
