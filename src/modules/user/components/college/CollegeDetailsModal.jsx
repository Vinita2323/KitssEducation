import React from "react";
import {
  X,
  MapPin,
  CheckCircle2,
  GraduationCap,
  Building2,
  Sparkles,
  Phone,
  Mail,
  Globe,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Award
} from "lucide-react";

export const CollegeDetailsModal = ({ college, isOpen, onClose }) => {
  if (!isOpen || !college) return null;

  // Resolve official website of the college
  const getOfficialWebsite = () => {
    let url = college?.contactInformation?.website || college?.website || "";
    if (url) {
      if (!/^https?:\/\//i.test(url)) {
        url = `https://${url}`;
      }
      return url;
    }
    return `https://www.google.com/search?q=${encodeURIComponent((college?.name || "College") + " official website")}`;
  };

  const officialWebsite = getOfficialWebsite();

  const handleOpenWebsite = (e) => {
    if (e) {
      e.stopPropagation();
    }
    window.open(officialWebsite, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div
        className="bg-white rounded-xl border border-slate-200/90 max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl relative flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center backdrop-blur-md transition cursor-pointer shadow-sm"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto flex-1 overscroll-contain">
          {/* Top Banner Image & Badges */}
          <div
            onClick={handleOpenWebsite}
            className="relative aspect-16/8 sm:aspect-21/9 w-full overflow-hidden bg-slate-900 cursor-pointer group"
            title={`Visit ${college.name} official website`}
          >
            <img
              src={college.banner || college.image || "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&auto=format&fit=crop&q=80"}
              alt={college.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/25 to-transparent" />

            {/* Floating Badges */}
            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white flex-wrap gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-900/80 backdrop-blur-md text-white border border-white/15 shadow-xs">
                {college.collegeType || college.category || "University"}
              </span>

              {college.verified && (
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-white/90 backdrop-blur-md text-slate-900 flex items-center gap-1 border border-white/20 shadow-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 fill-blue-50" />
                  <span>Verified Partner</span>
                </span>
              )}
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-6 space-y-4">
            {/* Header Title & Location */}
            <div className="space-y-1 pb-3 border-b border-slate-200/80">
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  onClick={handleOpenWebsite}
                  className="text-lg sm:text-xl font-bold text-slate-900 leading-tight hover:text-slate-700 transition-colors cursor-pointer tracking-tight"
                  title={`Visit ${college.name} official website`}
                >
                  {college.name}
                </h2>
                {college.verified && (
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 fill-blue-50" />
                )}
              </div>

              <p className="text-xs text-slate-500 flex items-center gap-1.5 pt-0.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{college.location || `${college.city}, ${college.state}`}</span>
              </p>
            </div>

            {/* About College */}
            <div className="space-y-1.5">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                About Institution
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {college.about || college.description}
              </p>
            </div>

            {/* Popular Courses / Available Programs */}
            {college.popularCourses && college.popularCourses.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Popular Programs & Degree Tracks
                </h3>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {college.popularCourses.map((course, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200/70"
                    >
                      {course}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Campus Facilities */}
            {college.facilities && college.facilities.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Campus Facilities
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                  {college.facilities.slice(0, 4).map((f, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200/70">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admission Information */}
            {college.admissionInformation && (
              <div className="p-3.5 rounded-lg bg-amber-500/5 border border-amber-500/20 space-y-1 text-xs text-slate-800">
                <span className="font-semibold text-amber-800 uppercase tracking-wider text-[11px] block">
                  Admission Guidance & Partner Quota
                </span>
                <p className="text-slate-600 leading-relaxed">
                  {college.admissionInformation}
                </p>
              </div>
            )}

            {/* Contact Information */}
            {college.contactInformation && (
              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500 flex-wrap gap-3">
                {college.contactInformation.phone && (
                  <span className="flex items-center gap-1.5 font-medium text-slate-700">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {college.contactInformation.phone}
                  </span>
                )}
                {college.contactInformation.website && (
                  <a
                    href={officialWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 font-medium text-slate-800 hover:text-slate-950 transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    <span>{college.contactInformation.website.replace(/^https?:\/\//i, "")}</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer with "Explore College" CTA - Navigates to Official Website */}
        <div className="p-3 sm:p-4 bg-slate-50/90 border-t border-slate-200/80 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white transition cursor-pointer"
          >
            Close
          </button>

          <a
            href={officialWebsite}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs transition-colors active:scale-[0.99] cursor-pointer"
          >
            <span>Explore College</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
