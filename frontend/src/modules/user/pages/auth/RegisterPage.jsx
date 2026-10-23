import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useOutletContext } from "react-router-dom";
import {
  GraduationCap,
  Building2,
  Building,
  BookOpen,
  ArrowRight,
  Sparkles,
  ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CollegeFranchiseForm } from "../../components/auth/CollegeFranchiseForm";
import { TuitionCoachingForm } from "../../components/auth/TuitionCoachingForm";
import { StudyRegistrationForm } from "../../components/auth/StudyRegistrationForm";
import { TeacherProfessorForm } from "../../components/auth/TeacherProfessorForm";

export const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get("type");
  
  // Screen state: null = Selection, 'franchise', 'tuition', 'study', 'teacher'
  const [selectedType, setSelectedType] = useState(initialType || null);
  const { setHidePageBack } = useOutletContext();

  useEffect(() => {
    setHidePageBack(Boolean(selectedType));
    return () => setHidePageBack(false);
  }, [selectedType, setHidePageBack]);

  useEffect(() => {
    const t = searchParams.get("type");
    if (t) {
      setSelectedType(t);
    }
  }, [searchParams]);

  const registrationOptions = [
    {
      id: "franchise",
      title: "1. Franchise Form",
      subtitle: "Institutional Partner",
      description: "Apply for institutional franchise under an approved University & College partner.",
      icon: Building2,
      badgeColor: "bg-amber-50 text-[#FF8A00] border-amber-200/80",
      iconBg: "bg-amber-50 text-[#FF8A00] group-hover:bg-[#FF8A00] group-hover:text-white",
      borderHover: "hover:border-[#FF8A00]",
      btnBg: "bg-[#FF8A00] hover:bg-[#E67C00] text-white",
      btnText: "Apply for Franchise"
    },
    {
      id: "tuition",
      title: "2. Tuition / Coaching Form",
      subtitle: "Academy & Coaching",
      description: "Register student profile for classroom, online and hybrid tuition batches.",
      icon: Building,
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200/80",
      iconBg: "bg-blue-50 text-blue-700 group-hover:bg-[#0A1D3F] group-hover:text-white",
      borderHover: "hover:border-[#0A1D3F]",
      btnBg: "bg-[#0A1D3F] hover:bg-[#133C8B] text-white",
      btnText: "Coaching Registration"
    },
    {
      id: "study",
      title: "3. Study Form",
      subtitle: "Student Learning",
      description: "Enroll as a student for digital books, video lectures, test series and exam prep.",
      icon: BookOpen,
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
      iconBg: "bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white",
      borderHover: "hover:border-emerald-500",
      btnBg: "bg-emerald-600 hover:bg-emerald-700 text-white",
      btnText: "Student Registration"
    },
    {
      id: "teacher",
      title: "4. Teacher / Professor Form",
      subtitle: "Faculty & Educator",
      description: "Join KITSS faculty panel to create video lectures, author tests and mentor students.",
      icon: GraduationCap,
      badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
      iconBg: "bg-indigo-50 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white",
      borderHover: "hover:border-indigo-500",
      btnBg: "bg-indigo-600 hover:bg-indigo-700 text-white",
      btnText: "Apply as Educator"
    }
  ];

  return (
    <div className="w-full transition-all duration-300">
      <AnimatePresence mode="wait">
        {/* ========================================================
            STATE 1: 4 REGISTRATION OPTIONS (COMPACT & SLEEK)
           ======================================================== */}
        {selectedType === null && (
          <motion.div
            key="selection-screen"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-2xl mx-auto space-y-3.5"
          >
            {/* Header Section */}
            <div className="text-center space-y-1.5 pb-0.5">
              <img
                src="/KitssLogo.png"
                alt="KITSS EDUCATION Logo"
                className="h-8 w-auto object-contain mx-auto"
              />
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-orange-50 text-[#FF8A00] text-[11px] font-bold uppercase tracking-wider border border-orange-200/60">
                <Sparkles className="w-3 h-3" />
                <span>KITSS Official Registration Portal</span>
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold text-[#0A1D3F] tracking-tight">
                Select Your Registration Form
              </h1>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Choose the appropriate form below to proceed with verification and enrollment.
              </p>
            </div>

            {/* 4 Cards Grid - Compact with Clean Rounded-lg */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {registrationOptions.map((opt) => {
                const Icon = opt.icon;
                return (
                  <div
                    key={opt.id}
                    onClick={() => setSelectedType(opt.id)}
                    className={`group bg-white p-3.5 sm:p-4 rounded-lg border border-slate-200/90 ${opt.borderHover} shadow-2xs hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between text-left active:scale-[0.99]`}
                  >
                    <div>
                      {/* Top Badge & Icon */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${opt.badgeColor}`}
                        >
                          {opt.subtitle}
                        </span>
                        <div
                          className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-colors duration-200 ${opt.iconBg}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                      </div>

                      {/* Card Title */}
                      <h2 className="text-xs sm:text-sm font-bold text-[#0A1D3F] leading-snug mb-1 group-hover:text-[#0A1D3F]">
                        {opt.title}
                      </h2>

                      {/* Card Description */}
                      <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed mb-3">
                        {opt.description}
                      </p>
                    </div>

                    {/* Action Button */}
                    <button
                      type="button"
                      className={`w-full py-2 px-3 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all duration-200 cursor-pointer ${opt.btnBg}`}
                    >
                      <span>{opt.btnText}</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Bottom Footer / Login Link */}
            <div className="text-center text-xs text-slate-500 bg-white p-2.5 sm:p-3 rounded-lg border border-slate-200 shadow-2xs">
              Already registered with KITSS Education?{" "}
              <Link to="/login" className="font-bold text-[#FF8A00] hover:underline">
                Login with Student / User ID
              </Link>
            </div>
          </motion.div>
        )}

        {/* ========================================================
            FORM 1: FRANCHISE REGISTRATION FORM (UNTOUCHED)
           ======================================================== */}
        {selectedType === "franchise" && (
          <motion.div
            key="franchise-form"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.18 }}
            className="w-full"
          >
            <CollegeFranchiseForm onBack={() => setSelectedType(null)} />
          </motion.div>
        )}

        {/* ========================================================
            FORM 2: TUITION / COACHING REGISTRATION FORM
           ======================================================== */}
        {selectedType === "tuition" && (
          <motion.div
            key="tuition-form"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.18 }}
            className="w-full"
          >
            <TuitionCoachingForm onBack={() => setSelectedType(null)} />
          </motion.div>
        )}

        {/* ========================================================
            FORM 3: STUDY REGISTRATION FORM
           ======================================================== */}
        {selectedType === "study" && (
          <motion.div
            key="study-form"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.18 }}
            className="w-full"
          >
            <StudyRegistrationForm onBack={() => setSelectedType(null)} />
          </motion.div>
        )}

        {/* ========================================================
            FORM 4: TEACHER / PROFESSOR REGISTRATION FORM
           ======================================================== */}
        {selectedType === "teacher" && (
          <motion.div
            key="teacher-form"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.18 }}
            className="w-full"
          >
            <TeacherProfessorForm onBack={() => setSelectedType(null)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
