// Shared defaults for the public page and its admin editor. No database seed is required.
export const categoryIcons = ['Video', 'Building2', 'FileCheck', 'BookOpen', 'GraduationCap', 'Globe', 'Library', 'Users'];
export const categoryColors = ['orange', 'blue', 'teal', 'navy', 'purple'];
export const categoryRoutes = ['/home', '/about', '/books', '/colleges', '/institutes', '/coaching', '/categories', '/results'];
export const defaultCategoryCards = [
  { id: 'coaching', title: 'Coaching', subtitle: 'Browse published courses, plans and supported lessons', tabLabel: 'Coaching', path: '/coaching', iconKey: 'Video', color: 'orange', badge: '', tags: ['Courses', 'Plans', 'Lessons'] },
  { id: 'franchise', title: 'Institutes & Franchise Network', subtitle: 'Browse published institution information', tabLabel: 'Institutes & Franchise', path: '/institutes', iconKey: 'Building2', color: 'blue', badge: '', tags: ['Institutes', 'Universities', 'Information'] },
  { id: 'results', title: 'Examination Results', subtitle: 'View available examination information and authorized result access', tabLabel: 'Exam Results', path: '/results', iconKey: 'FileCheck', color: 'teal', badge: '', tags: ['Examinations', 'Results'] },
  { id: 'books', title: 'Digital Books & Library', subtitle: 'Browse published books and approved previews', tabLabel: 'Digital Books', path: '/books', iconKey: 'BookOpen', color: 'blue', badge: 'E-LIBRARY', tags: ['Books', 'Previews', 'Reading'] },
  { id: 'colleges', title: 'Partner Colleges & Admissions', subtitle: 'Explore published college programs and admission enquiries', tabLabel: 'Partner Colleges', path: '/colleges', iconKey: 'GraduationCap', color: 'navy', badge: 'ADMISSIONS', tags: ['Colleges', 'Programs', 'Enquiries'] },
];
export function resolveCategoryCards(page = {}) {
  // An explicitly empty list means the owner removed all cards; do not restore defaults.
  if (Array.isArray(page.categoryCards)) return page.categoryCards;
  return defaultCategoryCards.map(card => {
    const legacy = page.sections?.flatMap(section => section.items || []).find(item => item.linkKey === card.path.slice(1));
    return { ...card, title: legacy?.heading || card.title, subtitle: legacy?.body || card.subtitle };
  });
}
export const categoryThemes = {
  orange: { iconBg: 'bg-orange-500 text-white', cardBg: 'hover:border-orange-400', badgeColor: 'bg-orange-600 text-white' },
  blue: { iconBg: 'bg-blue-600 text-white', cardBg: 'hover:border-blue-400', badgeColor: 'bg-blue-600 text-white' },
  teal: { iconBg: 'bg-teal-600 text-white', cardBg: 'hover:border-teal-400', badgeColor: 'bg-teal-700 text-white' },
  navy: { iconBg: 'bg-slate-800 text-white', cardBg: 'hover:border-slate-400', badgeColor: 'bg-slate-800 text-white' },
  purple: { iconBg: 'bg-purple-600 text-white', cardBg: 'hover:border-purple-400', badgeColor: 'bg-purple-700 text-white' },
};
