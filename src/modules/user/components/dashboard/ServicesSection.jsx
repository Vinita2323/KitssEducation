import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  GraduationCap,
  Video,
  BookOpen,
  Compass,
  ArrowRight,
  ShieldCheck,
  User,
  Headphones,
  Clock,
  Award,
  TrendingUp,
  Users,
  Building2,
  Star,
  Sparkles,
} from "lucide-react";

/**
 * Compact Top Header Illustration: Graduation Cap sitting on Stack of Books
 */
const CapAndBooksIllustration = () => (
  <div className="relative select-none shrink-0 flex items-center justify-center">
    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#E8F8F0] flex items-center justify-center p-1.5 relative overflow-hidden">
      <svg
        viewBox="0 0 120 120"
        className="w-full h-full drop-shadow-xs"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Sparkles */}
        <path
          d="M102 18L104 23L109 25L104 27L102 32L100 27L95 25L100 23L102 18Z"
          fill="#10B981"
        />
        <path
          d="M112 34L113.5 37L116.5 38.5L113.5 40L112 43L110.5 40L107.5 38.5L110.5 37L112 34Z"
          fill="#10B981"
          opacity="0.8"
        />
        <line x1="88" y1="16" x2="92" y2="12" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
        <line x1="97" y1="12" x2="99" y2="7" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
        <line x1="105" y1="14" x2="110" y2="11" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />

        {/* Bottom Book */}
        <path d="M18 90L72 104L104 93L50 79L18 90Z" fill="#F59E0B" />
        <path d="M18 90L72 104V110L18 96V90Z" fill="#D97706" />
        <path d="M72 104L104 93V99L72 110V104Z" fill="#FEF3C7" />
        <path d="M22 93L70 105.5V108.5L22 96V93Z" fill="#FFFBEB" />

        {/* Middle Book */}
        <path d="M16 77L70 91L100 80L46 66L16 77Z" fill="#10B981" />
        <path d="M16 77L70 91V97L16 83V77Z" fill="#059669" />
        <path d="M70 91L100 80V86L70 97V91Z" fill="#D1FAE5" />
        <path d="M20 80L68 92.5V94.5L20 82V80Z" fill="#ECFDF5" />

        {/* Top Book */}
        <path d="M20 63L72 77L98 66L46 52L20 63Z" fill="#3B82F6" />
        <path d="M20 63L72 77V83L20 69V63Z" fill="#1D4ED8" />
        <path d="M72 77L98 66V72L72 83V77Z" fill="#DBEAFE" />

        {/* Mortarboard Base Skullcap */}
        <path
          d="M44 48C44 54 56 59 69 59C82 59 94 54 94 48V42H44V48Z"
          fill="#0A1D3F"
        />

        {/* Mortarboard Diamond Top */}
        <path d="M69 22L105 36L69 50L33 36L69 22Z" fill="#1E293B" />
        <path d="M69 25L99 36L69 47L39 36L69 25Z" fill="#0A1D3F" />

        {/* Golden Tassel */}
        <circle cx="69" cy="36" r="3.5" fill="#F59E0B" />
        <path
          d="M69 36C74 40 83 44 85 50"
          stroke="#F59E0B"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path d="M84 50L87 63H82L84 50Z" fill="#F59E0B" />
      </svg>
    </div>
  </div>
);

/**
 * Compact Career Signpost Illustration: "CHOICE / CAREER / FUTURE"
 */
const CareerSignpostIllustration = () => (
  <div className="relative select-none shrink-0 hidden xs:flex items-center justify-center pl-1">
    <svg
      viewBox="0 0 100 85"
      className="w-14 h-14 sm:w-16 sm:h-16 select-none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Sparkles */}
      <path
        d="M86 14L88 18L92 20L88 22L86 26L84 22L80 20L84 18L86 14Z"
        fill="#8B5CF6"
      />
      <line x1="78" y1="12" x2="82" y2="8" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="86" y1="8" x2="88" y2="4" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" />

      {/* Ground Shadow */}
      <ellipse cx="50" cy="80" rx="14" ry="3.5" fill="#64748B" opacity="0.25" />

      {/* Main Post */}
      <rect x="47" y="10" width="6" height="70" rx="3" fill="#334155" />

      {/* Top Sign: CHOICE */}
      <path d="M22 23L29 15H64V31H29L22 23Z" fill="#10B981" />
      <text
        x="45"
        y="25"
        fill="white"
        fontSize="7.5"
        fontWeight="800"
        textAnchor="middle"
        letterSpacing="0.6"
      >
        CHOICE
      </text>

      {/* Middle Sign: CAREER */}
      <path d="M78 43L71 35H36V51H71L78 43Z" fill="#3B82F6" />
      <text
        x="54"
        y="45"
        fill="white"
        fontSize="7.5"
        fontWeight="800"
        textAnchor="middle"
        letterSpacing="0.6"
      >
        CAREER
      </text>

      {/* Bottom Sign: FUTURE */}
      <path d="M20 63L27 55H62V71H27L20 63Z" fill="#8B5CF6" />
      <text
        x="43"
        y="65"
        fill="white"
        fontSize="7.5"
        fontWeight="800"
        textAnchor="middle"
        letterSpacing="0.6"
      >
        FUTURE
      </text>
    </svg>
  </div>
);

/**
 * Service Cards Data Configuration
 */
const serviceCards = [
  {
    id: "colleges",
    title: "College Admissions",
    description:
      "Explore top partner colleges, compare programs, and apply directly through our platform.",
    path: "/colleges",
    icon: GraduationCap,
    cardBg: "bg-[#F3FAF5]",
    cardBorder: "border-[#DCF2E4]",
    iconBg: "bg-[#DCFCE7]",
    iconColor: "text-[#10B981]",
    ctaColor: "text-[#10B981] hover:text-[#059669]",
    arrowColor: "text-[#10B981]",
  },
  {
    id: "coaching",
    title: "Online Coaching",
    description:
      "Join live interactive batches, access recorded lectures, and prepare with top educators.",
    path: "/coaching",
    icon: Video,
    cardBg: "bg-[#FFF8F2]",
    cardBorder: "border-[#FFE6D5]",
    iconBg: "bg-[#FFEDD5]",
    iconColor: "text-[#F97316]",
    ctaColor: "text-[#F97316] hover:text-[#EA580C]",
    arrowColor: "text-[#F97316]",
  },
  {
    id: "books",
    title: "Study Resources",
    description:
      "Get notes, previous year papers, mock tests and more — all in one place.",
    path: "/books",
    icon: BookOpen,
    cardBg: "bg-[#F2F7FF]",
    cardBorder: "border-[#DAE8FF]",
    iconBg: "bg-[#DBEAFE]",
    iconColor: "text-[#3B82F6]",
    ctaColor: "text-[#3B82F6] hover:text-[#2563EB]",
    arrowColor: "text-[#3B82F6]",
  },
  {
    id: "career",
    title: "Career Guidance",
    description:
      "Get expert advice, career path suggestions and counselling for a brighter future.",
    path: "/categories",
    icon: Compass,
    cardBg: "bg-[#FAF5FF]",
    cardBorder: "border-[#EEDEFF]",
    iconBg: "bg-[#F3E8FF]",
    iconColor: "text-[#8B5CF6]",
    ctaColor: "text-[#8B5CF6] hover:text-[#7C3AED]",
    arrowColor: "text-[#8B5CF6]",
    hasSignpost: true,
  },
];

/**
 * Why Choose Us Feature Items
 */
const features = [
  {
    id: "colleges",
    title: "Trusted Colleges",
    description: "Partnered with top-rated colleges across India.",
    icon: ShieldCheck,
    iconBg: "bg-[#DCFCE7]",
    iconColor: "text-[#10B981]",
  },
  {
    id: "mentors",
    title: "Expert Mentors",
    description: "Learn from experienced and qualified educators.",
    icon: User,
    iconBg: "bg-[#DBEAFE]",
    iconColor: "text-[#3B82F6]",
  },
  {
    id: "support",
    title: "24/7 Support",
    description: "We're here to help, whenever you need us.",
    icon: Headphones,
    iconBg: "bg-[#CCFBF1]",
    iconColor: "text-[#0D9488]",
  },
  {
    id: "flexible",
    title: "Flexible Learning",
    description: "Study at your own pace, anytime, anywhere.",
    icon: Clock,
    iconBg: "bg-[#F3E8FF]",
    iconColor: "text-[#8B5CF6]",
  },
  {
    id: "resources",
    title: "Verified Resources",
    description: "Access genuine notes, papers and study material.",
    icon: Award,
    iconBg: "bg-[#FEF3C7]",
    iconColor: "text-[#D97706]",
  },
  {
    id: "results",
    title: "Better Results",
    description: "Track your progress and achieve your goals.",
    icon: TrendingUp,
    iconBg: "bg-[#FCE7F3]",
    iconColor: "text-[#DB2777]",
  },
];



export const ServicesSection = () => {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ========================================================================= */}
      {/* SECTION 1 — OUR SERVICES (COMPACT)                                        */}
      {/* ========================================================================= */}
      <section className="space-y-3 sm:space-y-3.5">
        {/* Compact Section Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-0.5 max-w-xl">
            {/* Small Label with Green Dot */}
            <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#10B981]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              <span>OUR SERVICES</span>
            </div>

            {/* Main Heading */}
            <h2 className="text-lg sm:text-xl md:text-2xl font-black text-[#0A1D3F] tracking-tight leading-snug">
              Everything You Need to Succeed
            </h2>

            {/* Description */}
            <p className="text-[11px] sm:text-xs text-slate-500 leading-snug max-w-lg line-clamp-2">
              Comprehensive educational solutions tailored for students. From
              admissions to exam preparation, we’ve got you covered.
            </p>
          </div>

          {/* Compact Top-Right Illustration */}
          <CapAndBooksIllustration />
        </div>

        {/* Compact Service Cards: 1 col on mobile, 2 cols on tablet, 4 cols on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 pt-0.5">
          {serviceCards.map((service, idx) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.05 }}
              >
                <Link
                  to={service.path}
                  className={`group relative flex flex-col justify-between rounded-2xl p-3 sm:p-3.5 border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs ${service.cardBg} ${service.cardBorder}`}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    {/* Left: Icon container + content */}
                    <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
                      {/* Compact Icon container */}
                      <div
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${service.iconBg} flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform duration-200`}
                      >
                        <Icon className={`w-4.5 h-4.5 sm:w-5 sm:h-5 ${service.iconColor}`} />
                      </div>

                      {/* Content block */}
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <h3 className="text-[13px] sm:text-sm font-bold text-[#0A1D3F] tracking-tight leading-snug truncate group-hover:text-slate-900 transition-colors">
                          {service.title}
                        </h3>
                        <p className="text-[10.5px] sm:text-[11px] text-slate-500 leading-tight line-clamp-2">
                          {service.description}
                        </p>
                      </div>
                    </div>

                    {/* Right side: Either the Career Guidance Signpost illustration OR the arrow */}
                    {service.hasSignpost ? (
                      <CareerSignpostIllustration />
                    ) : (
                      <div className="hidden xs:flex items-center self-center shrink-0 pr-0.5">
                        <span
                          className={`text-xs font-bold ${service.arrowColor} group-hover:translate-x-0.5 transition-transform`}
                        >
                          →
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Compact Bottom CTA link */}
                  <div className="pt-2 flex items-center justify-between border-t border-black/5 mt-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold transition-colors ${service.ctaColor}`}
                    >
                      <span>Explore Service</span>
                      <span className="group-hover:translate-x-0.5 transition-transform">
                        →
                      </span>
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2 — WHY CHOOSE US (COMPACT)                                       */}
      {/* ========================================================================= */}
      <section className="bg-[#EDF8F2] rounded-2xl sm:rounded-3xl border border-[#D5EFE0] p-3.5 sm:p-5 relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-5 items-center">
          {/* Left Column: Compact Header, Description, CTA */}
          <div className="lg:col-span-4 space-y-1.5 sm:space-y-2">
            <div className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#10B981]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              <span>WHY CHOOSE US</span>
            </div>

            <h3 className="text-base sm:text-lg md:text-xl font-black text-[#0A1D3F] tracking-tight leading-snug">
              Built for Your Success
            </h3>

            <p className="text-[11px] sm:text-xs text-slate-600 leading-snug max-w-sm">
              We combine technology, expert guidance and trusted partners to give
              you the best learning experience.
            </p>

            <div className="pt-1">
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 bg-[#059669] hover:bg-[#047857] text-white text-[11px] sm:text-xs font-bold px-3.5 py-1.5 rounded-full shadow-2xs hover:shadow-xs transition-all duration-200 active:scale-98 group"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Right Column: 6 Features in Compact 2-Column Grid */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
              {features.map((item) => {
                const ItemIcon = item.icon;
                return (
                  <div
                    key={item.id}
                    className="bg-white/95 backdrop-blur-2xs rounded-xl p-2 sm:p-2.5 border border-white/80 shadow-2xs hover:shadow-xs transition-all duration-200"
                  >
                    <div
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg ${item.iconBg} flex items-center justify-center mb-1`}
                    >
                      <ItemIcon className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${item.iconColor}`} />
                    </div>
                    <h4 className="text-[11px] sm:text-xs font-bold text-[#0A1D3F] leading-tight">
                      {item.title}
                    </h4>
                    <p className="text-[9.5px] sm:text-[10px] text-slate-500 leading-tight mt-0.5">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3 — ABOUT US BANNER (CLICKABLE TO /about)                         */}
      {/* ========================================================================= */}
      <section>
        <Link
          to="/about"
          className="group block relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-gradient-to-br from-[#0A1D3F] via-[#0E2958] to-[#123877] p-3.5 sm:p-5 text-white shadow-xs hover:shadow-md transition-all duration-300"
        >
          {/* Subtle Ambient Decorative Glows */}
          <div className="absolute top-0 right-0 w-56 h-56 bg-[#FF8A00]/15 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5 sm:gap-5">
            {/* Left Content */}
            <div className="space-y-1 sm:space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FF8A00]/20 border border-[#FF8A00]/40 text-[#FF8A00] text-[10px] sm:text-[11px] font-black uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" />
                  <span>About KITSS Education</span>
                </span>
                <span className="text-[10px] text-slate-300 font-medium hidden xs:inline-block">
                  • Est. 2012
                </span>
              </div>

              <h3 className="text-sm sm:text-base md:text-lg font-black tracking-tight leading-snug group-hover:text-white transition-colors">
                Discover Our Story, Leadership & Eminent Faculty
              </h3>

              <p className="text-[10.5px] sm:text-xs text-slate-300 leading-relaxed line-clamp-2 max-w-xl font-normal">
                Explore our organization profile, meet Founder Dr. R. K. Sharma, review our expert faculty credentials, and learn about our mission.
              </p>

              {/* Feature Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="px-2 py-0.5 rounded-md bg-white/10 text-slate-200 text-[9.5px] sm:text-[10px] font-semibold border border-white/10">
                  🏛️ Organization
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white/10 text-slate-200 text-[9.5px] sm:text-[10px] font-semibold border border-white/10">
                  👤 Director Profile
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white/10 text-slate-200 text-[9.5px] sm:text-[10px] font-semibold border border-white/10">
                  👨‍🏫 Master Faculty
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white/10 text-slate-200 text-[9.5px] sm:text-[10px] font-semibold border border-white/10">
                  🎯 Mission & Vision
                </span>
              </div>
            </div>

            {/* Right Side: Faculty Avatars & CTA Button */}
            <div className="flex items-center justify-between md:flex-col md:items-end gap-2.5 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t border-white/10 md:border-t-0">
              {/* Overlapping Teacher/Director Avatars */}
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2 overflow-hidden py-0.5">
                  <img
                    className="inline-block h-7 w-7 sm:h-8 sm:w-8 rounded-full ring-2 ring-[#0A1D3F] object-cover"
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                    alt="Director Dr. Sharma"
                  />
                  <img
                    className="inline-block h-7 w-7 sm:h-8 sm:w-8 rounded-full ring-2 ring-[#0A1D3F] object-cover"
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80"
                    alt="Prof. Verma"
                  />
                  <img
                    className="inline-block h-7 w-7 sm:h-8 sm:w-8 rounded-full ring-2 ring-[#0A1D3F] object-cover"
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80"
                    alt="Dr. Kulkarni"
                  />
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-[#FF8A00] text-[#0A1D3F] ring-2 ring-[#0A1D3F] flex items-center justify-center text-[9px] sm:text-[10px] font-black">
                    +50
                  </div>
                </div>
                <div className="text-left hidden sm:block">
                  <span className="block text-[10.5px] font-bold text-white leading-tight">Master Mentors</span>
                  <span className="block text-[9px] text-slate-300 leading-tight">IITians & Doctors</span>
                </div>
              </div>

              {/* Action Button */}
              <span className="inline-flex items-center gap-1.5 bg-white text-[#0A1D3F] group-hover:bg-[#FF8A00] group-hover:text-white px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-black transition-all duration-200 shadow-2xs shrink-0">
                <span>Explore About Us</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>
        </Link>
      </section>
    </div>
  );
};
