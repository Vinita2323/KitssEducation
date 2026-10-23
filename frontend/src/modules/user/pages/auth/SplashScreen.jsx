import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Video, FileCheck, ShieldCheck, ArrowRight } from "lucide-react";
import { PrimaryButton } from "../../components/common/PrimaryButton";

export const SplashScreen = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: BookOpen,
      title: "Digital Books",
      desc: "Board-wise, Class-wise & Subject-wise books",
      color: "bg-blue-500/10 text-blue-600"
    },
    {
      icon: Video,
      title: "Online Coaching",
      desc: "Live Classes, Video Lectures & Test Series",
      color: "bg-orange-500/10 text-orange-600"
    },
    {
      icon: FileCheck,
      title: "Results",
      desc: "Check, Download & Print Results",
      color: "bg-green-500/10 text-green-600"
    },
    {
      icon: ShieldCheck,
      title: "Secure & Easy",
      desc: "Single Device Login & Safe Payments",
      color: "bg-purple-500/10 text-purple-600"
    }
  ];

  return (
    <div className="min-h-screen bg-[#0A1D3F] text-white flex flex-col justify-between p-6 sm:p-8 font-['Poppins',sans-serif] relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute -top-20 -right-20 w-72 h-72 bg-[#FF8A00]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-[#133C8B]/40 rounded-full blur-3xl pointer-events-none" />

      {/* Top Branding */}
      <div className="pt-6 sm:pt-10 text-center relative z-10">
        <div className="inline-flex items-center justify-center p-3 bg-white rounded-3xl shadow-xl mb-4">
          <img
            src="/KitssLogo.png"
            alt="KITSS EDUCATION Logo"
            className="h-16 sm:h-20 w-auto object-contain"
          />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          KITSS <span className="text-[#FF8A00]">EDUCATION</span>
        </h1>
        <p className="text-xs sm:text-sm text-blue-200/90 font-semibold tracking-wider uppercase mt-1">
          Learn Today, Lead Tomorrow
        </p>
      </div>

      {/* Feature Highlights Grid */}
      <div className="max-w-md w-full mx-auto my-auto py-6 space-y-3 relative z-10">
        {features.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="flex items-center gap-3.5 p-3.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 shadow-sm"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.color} bg-white`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-white">{item.title}</h4>
                <p className="text-xs text-blue-100/70 truncate">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <div className="max-w-md w-full mx-auto space-y-3 relative z-10 pb-4">
        <PrimaryButton
          variant="orange"
          size="lg"
          fullWidth
          onClick={() => navigate("/onboarding")}
          icon={ArrowRight}
        >
          Get Started
        </PrimaryButton>

        <div className="text-center">
          <Link
            to="/login"
            className="text-xs text-blue-200 hover:text-white transition font-medium"
          >
            Already have an account? <span className="text-[#FF8A00] font-bold">Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
