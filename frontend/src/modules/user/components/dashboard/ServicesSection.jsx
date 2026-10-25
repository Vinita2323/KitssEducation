import { usePublishedContent, PublishedSections } from '../common/PublishedContent';
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
  const {data,error,loading} = usePublishedContent('home');
  return <section className="space-y-4"><div className="flex items-center gap-3"><CapAndBooksIllustration /><div><h1 className="text-lg sm:text-2xl font-black text-[#0A1D3F]">Educational resources</h1><p className="text-xs text-[#667085]">Published services and information</p></div></div>{loading&&<p role="status">Loading published content...</p>}{error&&<p role="alert" className="text-red-700">{error}</p>}{!loading&&!error&&<PublishedSections sections={data.sections.filter(section => section.key !== 'about-teaser')} />}</section>;
};
