import React from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export const AuthLayout = ({ title, showBack = true, backPath }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isRegisterPage = location.pathname === "/register";

  const handleBack = () => {
    if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col justify-between font-['Poppins',sans-serif] text-[#0A1D3F] p-3 sm:p-5 md:p-6">
      {/* Top Header */}
      <div className={`${isRegisterPage ? "max-w-2xl lg:max-w-3xl" : "max-w-sm"} w-full mx-auto flex items-center justify-between min-h-[30px] mb-1.5`}>
        {showBack ? (
          <button
            type="button"
            onClick={handleBack}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-[#E6E8EC] text-[#0A1D3F] hover:bg-gray-50 active:scale-95 transition shadow-2xs cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        ) : (
          <div />
        )}
      </div>

      {/* Auth Content Card */}
      <div className={`${isRegisterPage ? "max-w-2xl lg:max-w-3xl" : "max-w-sm"} w-full mx-auto my-auto py-1 sm:py-2 transition-all duration-300`}>
        <Outlet />
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-[#667085] py-1">
        <p>KITSS EDUCATION • Learn Today, Lead Tomorrow</p>
      </div>
    </div>
  );
};
