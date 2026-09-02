import React from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export const AuthLayout = ({ title, showBack = true, backPath }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col justify-between font-['Poppins',sans-serif] text-[#0A1D3F] p-4 sm:p-6 md:p-8">
      {/* Top Header */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between min-h-[36px]">
        {showBack ? (
          <button
            type="button"
            onClick={handleBack}
            className="p-2 rounded-xl bg-white border border-[#E6E8EC] text-[#0A1D3F] hover:bg-gray-50 active:scale-95 transition shadow-2xs"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <div />
        )}
      </div>

      {/* Auth Content Card */}
      <div className="max-w-md w-full mx-auto my-auto py-6">
        <Outlet />
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-[#667085] py-2">
        <p>KITSS EDUCATION • Learn Today, Lead Tomorrow</p>
      </div>
    </div>
  );
};
