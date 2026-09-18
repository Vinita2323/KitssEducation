import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Layers, GraduationCap, ShieldCheck, User } from "lucide-react";

export const BottomNavigation = () => {
  const location = useLocation();

  const navItems = [
    { label: "Home", path: "/home", icon: Home },
    { label: "Categories", path: "/categories", icon: Layers },
    { label: "Colleges", path: "/colleges", icon: GraduationCap },
    { label: "Subscriptions", path: "/subscriptions", icon: ShieldCheck },
    { label: "Profile", path: "/profile", icon: User }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 px-2 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom,12px))] shadow-[0_-4px_20px_rgba(10,29,63,0.06)]">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;

          const isHome =
            item.path === "/home" &&
            (location.pathname === "/home" || location.pathname === "/");
          const isActive =
            isHome ||
            (item.path !== "/home" &&
              (location.pathname === item.path || location.pathname.startsWith(item.path)));

          return (
            <Link
              key={item.label}
              to={item.path}
              className="relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl touch-target cursor-pointer transition-colors"
            >
              <motion.div
                whileTap={{ scale: 0.88 }}
                className="flex flex-col items-center justify-center relative z-10"
              >
                {/* Sliding Active Pill Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="bottomNavActivePill"
                    className="absolute inset-0 -top-1 -bottom-1 -left-2.5 -right-2.5 bg-orange-50 border border-orange-200/70 rounded-2xl -z-10 shadow-2xs"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}

                <Icon
                  className={`w-5 h-5 transition-all duration-200 ${
                    isActive
                      ? "stroke-[2.4] scale-110 text-[#FF8A00]"
                      : "stroke-[1.8] text-slate-500"
                  }`}
                />
                <span
                  className={`text-[10px] mt-0.5 tracking-tight transition-colors ${
                    isActive
                      ? "font-bold text-[#FF8A00]"
                      : "font-medium text-slate-500"
                  }`}
                >
                  {item.label}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
