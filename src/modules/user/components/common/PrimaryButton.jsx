import React from "react";
import { Loader2 } from "lucide-react";

export const PrimaryButton = ({
  children,
  onClick,
  type = "button",
  variant = "navy", // 'navy' | 'orange' | 'green'
  size = "md", // 'sm' | 'md' | 'lg'
  fullWidth = false,
  disabled = false,
  loading = false,
  icon: Icon,
  className = ""
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed touch-target";

  const variants = {
    navy: "bg-[#0A1D3F] hover:bg-[#133C8B] text-white shadow-sm hover:shadow-md active:bg-[#061226]",
    orange: "bg-[#FF8A00] hover:bg-[#E67C00] text-white shadow-sm hover:shadow-md active:bg-[#CC6F00]",
    green: "bg-[#17B26A] hover:bg-[#0E9355] text-white shadow-sm hover:shadow-md"
  };

  const sizes = {
    sm: "px-3.5 py-2 text-xs gap-1.5",
    md: "px-5 py-2.5 text-sm gap-2",
    lg: "px-6 py-3.5 text-base gap-2.5"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant] || variants.navy} ${
        sizes[size] || sizes.md
      } ${fullWidth ? "w-full" : ""} ${className}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        Icon && <Icon className="w-4 h-4 shrink-0" />
      )}
      <span>{children}</span>
    </button>
  );
};

export const SecondaryButton = ({
  children,
  onClick,
  type = "button",
  size = "md",
  fullWidth = false,
  disabled = false,
  loading = false,
  icon: Icon,
  className = ""
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 border border-[#E6E8EC] bg-white text-[#0A1D3F] hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none touch-target";

  const sizes = {
    sm: "px-3.5 py-2 text-xs gap-1.5",
    md: "px-5 py-2.5 text-sm gap-2",
    lg: "px-6 py-3.5 text-base gap-2.5"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${sizes[size] || sizes.md} ${
        fullWidth ? "w-full" : ""
      } ${className}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        Icon && <Icon className="w-4 h-4 shrink-0 text-[#667085]" />
      )}
      <span>{children}</span>
    </button>
  );
};
