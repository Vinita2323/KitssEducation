import React from "react";
import { Link } from "react-router-dom";
import { Video, FileCheck, ShoppingBag } from "lucide-react";

export const QuickAccessGrid = () => {
  const items = [
    {
      label: "Online Coaching",
      path: "/coaching",
      icon: Video,
      iconStyle: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    },
    {
      label: "Results",
      path: "/results",
      icon: FileCheck,
      iconStyle: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    },
    {
      label: "My Orders",
      path: "/orders",
      icon: ShoppingBag,
      iconStyle: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2.5 sm:gap-4 mb-6">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            to={item.path}
            className="group flex flex-col items-center justify-center p-3 sm:p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all duration-150 active:scale-[0.99] text-center touch-target"
          >
            <div
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-lg border flex items-center justify-center transition-transform duration-150 group-hover:scale-105 mb-2.5 ${item.iconStyle}`}
            >
              <Icon className="w-5 h-5 stroke-[1.8]" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 tracking-tight leading-tight text-center">
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
};
