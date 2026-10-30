import { usePublishedContent, PublishedSections } from '../common/PublishedContent';
import React from "react";
import { Link } from "react-router-dom";
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

const icons = { GraduationCap, Video, BookOpen, Compass, ShieldCheck, User, Headphones, Clock, Award, TrendingUp, Building2, Users, Star, Sparkles };
const colors = {
  green: ['bg-[#F3FAF5] border-[#DCF2E4]', 'bg-[#DCFCE7] text-emerald-700'],
  orange: ['bg-[#FFF8F2] border-[#FFE6D5]', 'bg-[#FFEDD5] text-orange-700'],
  blue: ['bg-[#F2F7FF] border-[#DAE8FF]', 'bg-[#DBEAFE] text-blue-700'],
  purple: ['bg-[#FAF5FF] border-[#EEDEFF]', 'bg-[#F3E8FF] text-purple-700'],
  teal: ['bg-teal-50 border-teal-100', 'bg-teal-100 text-teal-700'],
  amber: ['bg-amber-50 border-amber-100', 'bg-amber-100 text-amber-700'],
  pink: ['bg-pink-50 border-pink-100', 'bg-pink-100 text-pink-700'],
};
const routes = { home: '/home', about: '/about', books: '/books', colleges: '/colleges', institutes: '/colleges', coaching: '/coaching', categories: '/categories', results: '/results' };
const serviceIcons = ['GraduationCap', 'Video', 'BookOpen', 'Compass'];
const featureIcons = ['ShieldCheck', 'User', 'Headphones', 'Clock', 'Award', 'TrendingUp'];
const serviceColors = ['green', 'orange', 'blue', 'purple'];
const featureColors = ['green', 'blue', 'teal', 'purple', 'amber', 'pink'];
function HomeCards({ section, features = false }) {
  return <div className={features ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3' : 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3'}>{section.items.map((item, i) => {
    const Icon = icons[item.iconKey] || icons[(features ? featureIcons : serviceIcons)[i % (features ? 6 : 4)]];
    const [card, icon] = colors[item.color] || colors[(features ? featureColors : serviceColors)[i % (features ? 6 : 4)]];
    return <article key={i} className={`min-w-0 rounded-2xl border p-3.5 ${features ? 'bg-white border-white' : card}`}>
      <div className={features ? 'space-y-2' : 'flex gap-3 items-start'}><span className={`inline-flex shrink-0 items-center justify-center rounded-xl ${features ? 'w-8 h-8' : 'w-10 h-10'} ${icon}`}><Icon aria-hidden="true" className="w-5 h-5" /></span><div className="min-w-0"><h3 className="font-bold text-sm text-[#0A1D3F] break-words">{item.heading}</h3><p className="mt-1 text-xs text-[#667085] whitespace-pre-line break-words">{item.body}</p></div></div>
      {routes[item.linkKey] && <Link to={routes[item.linkKey]} className={`mt-3 pt-2 border-t border-black/5 flex items-center gap-2 text-xs font-bold ${icon.split(' ').at(-1)}`}>Explore service<ArrowRight aria-hidden="true" className="w-3 h-3" /><span className="sr-only">: {item.heading}</span></Link>}
    </article>;
  })}</div>;
}
export const ServicesSection = () => {
  const { data, error, loading } = usePublishedContent('home');
  let cardIndex = 0;
  return <div className="space-y-6">{loading && <p role="status">Loading information...</p>}{error && <p role="alert" className="text-red-700">{error}</p>}{!loading && !error && data.sections.filter(section => section.key !== 'about-teaser').map(section => {
    // Existing published card sections retain their text and order without a migration.
    if (section.type === 'cards') cardIndex++;
    const layout = section.layout || (section.type === 'cards' ? (cardIndex === 1 ? 'services' : cardIndex === 2 ? 'features' : 'standard') : 'standard');
    if (layout === 'standard') return <PublishedSections key={section.key} sections={[section]} />;
    if (layout === 'features') return <section key={section.key} aria-label="Why choose us" className="rounded-3xl border border-emerald-100 bg-[#ECF8F2] p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-5 items-center"><div className="space-y-2"><p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Why choose us</p><h2 className="text-xl font-extrabold text-[#0A1D3F] break-words">{section.heading}</h2><p className="text-xs text-[#667085] whitespace-pre-line">{section.body}</p></div><div className="space-y-3"><HomeCards section={section} features />{section.mediaAssetIds?.map(id => <img key={id} src={'/api/v1/media/' + id + '/content'} alt={section.heading || ''} className="max-h-72 w-full object-contain rounded-xl" />)}</div></section>;
    return <section key={section.key} aria-label="Our services" className="space-y-4"><div className="flex justify-between items-center gap-4"><div><p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Our services</p><h2 className="mt-1 text-xl sm:text-2xl font-extrabold text-[#0A1D3F] break-words">{section.heading}</h2><p className="mt-1 text-xs text-[#667085] whitespace-pre-line">{section.body}</p></div><CapAndBooksIllustration /></div><HomeCards section={section} />{section.mediaAssetIds?.map(id => <img key={id} src={'/api/v1/media/' + id + '/content'} alt={section.heading || ''} className="max-h-72 w-full object-contain rounded-xl" />)}</section>;
  })}{!loading && !error && !data.sections.length && <p className="text-sm text-[#667085]">More information will be available soon.</p>}</div>;
};
