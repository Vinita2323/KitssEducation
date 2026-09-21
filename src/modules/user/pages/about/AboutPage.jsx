import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2,
  GraduationCap,
  Target,
  Sparkles,
  Award,
  Users,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  Quote,
  Star,
  ShieldCheck,
  Compass,
  ArrowLeft,
} from "lucide-react";

/**
 * Teachers and Faculty Data (Concise & Focused)
 */
const facultyMembers = [
  {
    id: 1,
    name: "Prof. Arvind Verma",
    role: "Head of Physics & JEE Lead",
    qualifications: "B.Tech & M.Tech (IIT Kharagpur)",
    experience: "16+ Yrs Exp",
    specialty: "Mechanics & Electrodynamics",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
    badge: "Ex-IIT Faculty",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    studentsMentored: "15k+",
  },
  {
    id: 2,
    name: "Dr. Sunita Kulkarni",
    role: "Dean of Mathematics",
    qualifications: "Ph.D. Applied Math (IISc)",
    experience: "14+ Yrs Exp",
    specialty: "Calculus & Algebra",
    image:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
    badge: "Gold Medalist",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    studentsMentored: "12k+",
  },
  {
    id: 3,
    name: "Er. Manish Agarwal",
    role: "Lead Chemistry Specialist",
    qualifications: "M.Sc Chemistry (DU), NET",
    experience: "12+ Yrs Exp",
    specialty: "Organic & Physical Chem",
    image:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&auto=format&fit=crop&q=80",
    badge: "Organic Lead",
    badgeColor: "bg-orange-50 text-orange-700 border-orange-200",
    studentsMentored: "10k+",
  },
  {
    id: 4,
    name: "Dr. Neha Saxena",
    role: "Senior NEET Biology Mentor",
    qualifications: "MBBS, M.D. (AIIMS)",
    experience: "11+ Yrs Exp",
    specialty: "Physiology & Genetics",
    image:
      "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=200&auto=format&fit=crop&q=80",
    badge: "AIIMS Alumna",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    studentsMentored: "9.5k+",
  },
  {
    id: 5,
    name: "Prof. Vikram Singhania",
    role: "Dean of Computer Science",
    qualifications: "M.Tech CSE (BITS Pilani)",
    experience: "13+ Yrs Exp",
    specialty: "Python & Data Structures",
    image:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80",
    badge: "Tech Mentor",
    badgeColor: "bg-cyan-50 text-cyan-700 border-cyan-200",
    studentsMentored: "8k+",
  },
  {
    id: 6,
    name: "Smt. Ananya Bose",
    role: "Dean of Career Admissions",
    qualifications: "M.A. Psychology & Counselor",
    experience: "15+ Yrs Exp",
    specialty: "College Admissions Guidance",
    image:
      "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&auto=format&fit=crop&q=80",
    badge: "Certified",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
    studentsMentored: "20k+",
  },
];

export const AboutPage = () => {
  const [activeFacultyFilter, setActiveFacultyFilter] = useState("all");

  const filteredFaculty =
    activeFacultyFilter === "all"
      ? facultyMembers
      : facultyMembers.filter((m) =>
          activeFacultyFilter === "jee"
            ? m.role.toLowerCase().includes("physics") ||
              m.role.toLowerCase().includes("mathematics") ||
              m.role.toLowerCase().includes("chemistry")
            : activeFacultyFilter === "neet"
            ? m.role.toLowerCase().includes("biology") ||
              m.role.toLowerCase().includes("chemistry")
            : m.role.toLowerCase().includes("admissions") ||
              m.role.toLowerCase().includes("computer")
        );

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-4 sm:space-y-5 max-w-7xl mx-auto pb-8"
    >
      {/* ========================================================================= */}
      {/* 1. COMPACT HERO HEADER                                                    */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#0A1D3F] via-[#0E2856] to-[#123979] text-white p-4 sm:p-6 shadow-sm">
        <div className="relative z-10 space-y-2 max-w-3xl">
          <div className="flex items-center justify-between gap-2">
            <Link
              to="/home"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-300 hover:text-white bg-white/10 px-2.5 py-1 rounded-full border border-white/10 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Back to Home</span>
            </Link>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FF8A00]/20 border border-[#FF8A00]/40 text-[#FF8A00] text-[10px] font-black uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              <span>About KITSS Education</span>
            </div>
          </div>

          <h1 className="text-lg sm:text-2xl md:text-3xl font-black tracking-tight leading-snug">
            Pioneering Excellence in Education & Mentorship
          </h1>

          <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed font-normal max-w-2xl">
            Established in 2012, KITSS Education empowers over 50,000 learners with top-tier board coaching, JEE/NEET prep, digital learning resources, and verified college admissions.
          </p>

          {/* Compact Stats Ribbon */}
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/15 text-center">
            <div className="p-1">
              <span className="block text-sm sm:text-lg font-black text-[#FF8A00]">2012</span>
              <span className="text-[10px] text-slate-300">Established</span>
            </div>
            <div className="p-1">
              <span className="block text-sm sm:text-lg font-black text-white">50k+</span>
              <span className="text-[10px] text-slate-300">Students</span>
            </div>
            <div className="p-1">
              <span className="block text-sm sm:text-lg font-black text-emerald-400">200+</span>
              <span className="text-[10px] text-slate-300">Colleges</span>
            </div>
            <div className="p-1">
              <span className="block text-sm sm:text-lg font-black text-amber-300">95%</span>
              <span className="text-[10px] text-slate-300">Success</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. COMPACT ORGANIZATION PROFILE & PRINCIPLES                              */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-3.5 sm:p-5 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#10B981]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              <span>ORGANIZATION PROFILE</span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-[#0A1D3F]">
              Who We Are & What We Stand For
            </h2>
          </div>
          <span className="hidden xs:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[10.5px] font-bold">
            <Building2 className="w-3.5 h-3.5 text-[#0A1D3F]" />
            Registered Entity
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 sm:gap-4 items-start">
          {/* Concise Story */}
          <div className="md:col-span-6 space-y-2 text-[11.5px] sm:text-xs text-slate-600 leading-relaxed">
            <p>
              <strong className="text-[#0A1D3F] font-bold">KITSS Education</strong> was established to dismantle academic barriers and provide structured, quality education for every ambitious learner.
            </p>
            <p>
              We cover the entire student journey: from CBSE/ICSE board foundations, to JEE & NEET competitive success, and finally direct, transparent admissions into accredited partner universities across India.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                <ShieldCheck className="w-3 h-3" /> UGC/AICTE Accredited Partners
              </span>
              <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">
                <Award className="w-3 h-3" /> IITian Mentorship
              </span>
            </div>
          </div>

          {/* 4 Core Principles in a Tight 2x2 Grid */}
          <div className="md:col-span-6 grid grid-cols-2 gap-2">
            {[
              {
                title: "Student Centricity",
                desc: "Mentorship focused on student growth & clarity.",
                icon: Users,
                color: "text-blue-600 bg-blue-50",
              },
              {
                title: "Ethical Transparency",
                desc: "Zero hidden costs & unbiased college admissions.",
                icon: CheckCircle2,
                color: "text-emerald-600 bg-emerald-50",
              },
              {
                title: "Pedagogic Rigor",
                desc: "Curriculums curated by top ex-IIT faculty.",
                icon: Sparkles,
                color: "text-orange-600 bg-orange-50",
              },
              {
                title: "Pan-India Inclusivity",
                desc: "Accessible learning across metro & tier-2 cities.",
                icon: Compass,
                color: "text-purple-600 bg-purple-50",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="p-2 sm:p-2.5 rounded-xl bg-slate-50/80 border border-slate-100"
                >
                  <div
                    className={`w-6 h-6 rounded-lg ${item.color} flex items-center justify-center mb-1`}
                  >
                    <Icon className="w-3 h-3" />
                  </div>
                  <h4 className="text-[11px] font-bold text-[#0A1D3F] leading-snug">
                    {item.title}
                  </h4>
                  <p className="text-[9.5px] sm:text-[10px] text-slate-500 leading-tight mt-0.5">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. COMPACT MISSION & VISION (SIDE-BY-SIDE)                                */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
        {/* Mission */}
        <div className="bg-[#F0FAF5] rounded-2xl border border-[#D3EEDF] p-3 sm:p-4 flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#DCFCE7] flex items-center justify-center text-[#10B981] shrink-0 mt-0.5">
            <Target className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[9.5px] font-black uppercase tracking-wider text-[#059669]">
              OUR MISSION
            </span>
            <h3 className="text-xs sm:text-sm font-black text-[#0A1D3F]">
              Democratizing World-Class Learning
            </h3>
            <p className="text-[10.5px] sm:text-[11px] text-slate-600 leading-snug">
              To empower every student with affordable, tech-enabled coaching, authentic study materials, and transparent college admission pathways.
            </p>
          </div>
        </div>

        {/* Vision */}
        <div className="bg-[#FAF5FF] rounded-2xl border border-[#EEDEFF] p-3 sm:p-4 flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#F3E8FF] flex items-center justify-center text-[#8B5CF6] shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[9.5px] font-black uppercase tracking-wider text-[#7C3AED]">
              OUR VISION
            </span>
            <h3 className="text-xs sm:text-sm font-black text-[#0A1D3F]">
              India's Most Trusted Education Hub
            </h3>
            <p className="text-[10.5px] sm:text-[11px] text-slate-600 leading-snug">
              To set benchmarks in faculty excellence, digital pedagogy, and student transformation—turning academic dreams into lifelong careers.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. COMPACT DIRECTOR PROFILE WITH PHOTO                                    */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-3.5 sm:p-5 shadow-2xs relative overflow-hidden">
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <div className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#FF8A00]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF8A00]" />
                <span>LEADERSHIP & GOVERNANCE</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-[#0A1D3F]">
                Director's Profile & Message
              </h2>
            </div>
            <span className="text-[10px] font-bold text-[#FF8A00] bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">
              Founder's Vision
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 sm:gap-5">
            {/* Director Photo & Name */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-slate-100 relative shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80"
                  alt="Dr. Rajeshwar Sharma - Director"
                  className="w-full h-full object-cover object-top"
                  onError={(e) => {
                    e.target.src =
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80";
                  }}
                />
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-black text-[#0A1D3F]">
                  Dr. Rajeshwar Sharma
                </h3>
                <p className="text-[11px] text-[#FF8A00] font-bold leading-tight">
                  Founder & Managing Director
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Ph.D. (IIT Delhi) • 25+ Yrs Academic Leadership
                </p>
                <span className="inline-block mt-1 text-[9px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  National Leadership Awardee
                </span>
              </div>
            </div>

            {/* Director's Compact Note */}
            <div className="flex-1 bg-gradient-to-br from-orange-50/60 via-white to-amber-50/40 p-3 rounded-xl border border-orange-100/90 text-[11px] sm:text-xs text-[#0A1D3F] italic leading-relaxed">
              <p>
                “Every student possesses limitless potential. Our mission at KITSS Education is not merely to prepare them for exams, but to spark curiosity, build resilience, and empower them to lead with integrity.”
              </p>
              <span className="block not-italic text-[10px] font-bold text-slate-500 mt-1">
                — Dr. Rajeshwar Sharma, New Delhi
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. COMPACT TEACHERS & FACULTY PROFILES                                    */}
      {/* ========================================================================= */}
      <section className="space-y-3">
        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#3B82F6]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
              <span>EMINENT EDUCATORS</span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-[#0A1D3F]">
              Teachers & Faculty Profiles
            </h2>
          </div>

          {/* Compact Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
            {[
              { key: "all", label: "All" },
              { key: "jee", label: "JEE & Boards" },
              { key: "neet", label: "NEET Medical" },
              { key: "counseling", label: "Admissions" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveFacultyFilter(tab.key)}
                className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeFacultyFilter === tab.key
                    ? "bg-[#0A1D3F] text-white shadow-2xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Compact Faculty Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {filteredFaculty.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-2.5 sm:p-3 flex items-start gap-2.5 hover:border-slate-300 transition-all shadow-2xs"
            >
              {/* Avatar */}
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src =
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80";
                  }}
                />
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center justify-between gap-1">
                  <h3 className="text-xs sm:text-[13px] font-black text-[#0A1D3F] truncate">
                    {member.name}
                  </h3>
                  <span
                    className={`text-[8.5px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${member.badgeColor}`}
                  >
                    {member.badge}
                  </span>
                </div>

                <p className="text-[10.5px] text-[#FF8A00] font-semibold truncate leading-tight">
                  {member.role}
                </p>

                <p className="text-[10px] text-slate-500 truncate leading-tight">
                  {member.qualifications}
                </p>

                <div className="pt-1 flex items-center justify-between text-[9.5px] text-slate-400 border-t border-slate-100 mt-1">
                  <span>{member.experience}</span>
                  <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded">
                    {member.studentsMentored} Mentored
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. COMPACT CTA STRIP                                                      */}
      {/* ========================================================================= */}
      <section className="bg-gradient-to-r from-[#0A1D3F] via-[#0E2958] to-[#123877] rounded-2xl p-3.5 sm:p-4 text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="space-y-0.5 text-center sm:text-left">
          <div className="inline-flex items-center gap-1 text-[10px] font-bold text-[#FF8A00]">
            <Sparkles className="w-3 h-3" />
            <span>Ready to Begin?</span>
          </div>
          <h3 className="text-xs sm:text-sm font-black">
            Accelerate Your Learning with KITSS Education
          </h3>
          <p className="text-[10.5px] text-slate-300">
            Connect with counselors or explore our partner colleges & online courses.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/colleges"
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-[#0A1D3F] text-[11px] font-black transition shadow-2xs"
          >
            Partner Colleges
          </Link>
          <Link
            to="/coaching"
            className="px-3 py-1.5 rounded-xl bg-[#FF8A00] hover:bg-[#E67A00] text-white text-[11px] font-black transition shadow-2xs inline-flex items-center gap-1"
          >
            <span>Courses</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </section>
    </motion.div>
  );
};
