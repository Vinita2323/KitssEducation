import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ChevronRight, BookOpen, Video, FileCheck, Sparkles } from "lucide-react";
import { PrimaryButton } from "../../components/common/PrimaryButton";

export const OnboardingPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  const slides = [
    {
      icon: "📚",
      badge: "Digital Books",
      title: "One Platform.\nEndless Learning.",
      subtitle: "Books, Online Coaching, Results and much more...",
      accent: "from-blue-500 to-indigo-600"
    },
    {
      icon: "🎥",
      badge: "Online Coaching",
      title: "Master Every Topic\nWith Expert Educators.",
      subtitle: "Watch live & recorded chapter-wise lectures with comprehensive study materials.",
      accent: "from-orange-500 to-amber-600"
    },
    {
      icon: "🏆",
      badge: "Examination Results",
      title: "Check & Download\nYour Exam Results.",
      subtitle: "Search official board marks, download digital marksheets and print anytime.",
      accent: "from-emerald-500 to-teal-600"
    }
  ];

  const handleNext = () => {
    if (currentStep < slides.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      navigate("/login");
    }
  };

  const handleSkip = () => {
    navigate("/login");
  };

  const current = slides[currentStep];

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col justify-between p-6 sm:p-8 font-['Poppins',sans-serif] text-[#0A1D3F]">
      {/* Top Controls */}
      <div className="flex items-center justify-between max-w-md w-full mx-auto">
        <div className="flex items-center gap-2">
          <img
            src="/KitssLogo.png"
            alt="KITSS Logo"
            className="h-9 w-auto object-contain"
          />
        </div>

        {currentStep < slides.length - 1 && (
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs font-bold text-[#667085] hover:text-[#0A1D3F] px-3 py-1.5 rounded-xl hover:bg-gray-200/50 transition"
          >
            Skip
          </button>
        )}
      </div>

      {/* Middle Illustration & Info */}
      <div className="max-w-md w-full mx-auto my-auto py-8 flex flex-col items-center text-center">
        {/* Animated Visual Character / Graphic Card */}
        <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-3xl bg-white border border-[#E6E8EC] shadow-md flex flex-col items-center justify-center p-6 relative mb-8 overflow-hidden">
          <div className="w-28 h-28 rounded-2xl bg-[#0A1D3F]/5 flex items-center justify-center text-6xl select-none mb-3 shadow-inner">
            {current.icon}
          </div>

          <div className="flex items-center gap-1 text-xs font-bold text-[#FF8A00] bg-orange-50 px-3 py-1 rounded-full border border-orange-200/60">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{current.badge}</span>
          </div>

          {/* Floating UI Elements */}
          <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#133C8B]/10 flex items-center justify-center text-xs">
            ✨
          </div>
          <div className="absolute bottom-4 left-4 w-8 h-8 rounded-full bg-[#FF8A00]/10 flex items-center justify-center text-xs">
            🎓
          </div>
        </div>

        {/* Content Heading */}
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#0A1D3F] leading-tight whitespace-pre-line tracking-tight mb-2">
          {current.title}
        </h2>

        <p className="text-xs sm:text-sm text-[#667085] max-w-xs leading-relaxed">
          {current.subtitle}
        </p>

        {/* Step Indicator Dots */}
        <div className="flex items-center gap-2 mt-6">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentStep === idx
                  ? "w-7 bg-[#0A1D3F]"
                  : "w-2 bg-gray-300 hover:bg-gray-400"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="max-w-md w-full mx-auto space-y-3 pb-2">
        <PrimaryButton
          variant={currentStep === slides.length - 1 ? "orange" : "navy"}
          size="lg"
          fullWidth
          onClick={handleNext}
          icon={ArrowRight}
        >
          {currentStep === slides.length - 1 ? "Get Started" : "Next"}
        </PrimaryButton>

        <div className="text-center">
          <Link
            to="/login"
            className="text-xs text-[#667085] hover:text-[#0A1D3F] transition font-medium"
          >
            Already have an account?{" "}
            <span className="text-[#FF8A00] font-bold">Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
