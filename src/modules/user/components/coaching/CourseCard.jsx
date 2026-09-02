import React from "react";
import { Link } from "react-router-dom";
import { Video, FileText, Star, ShieldCheck, CheckCircle2 } from "lucide-react";
import { PriceDisplay, RatingBadge } from "../common/SectionHeader";
import { useLibrary } from "../../context/LibraryContext";

export const CourseCard = ({ course, layout = "grid" }) => {
  const { isCourseEnrolled } = useLibrary();
  const enrolled = isCourseEnrolled(course.id);

  if (layout === "horizontal") {
    return (
      <div className="shrink-0 w-72 sm:w-80 bg-white rounded-2xl border border-[#E6E8EC] p-3 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
        <div>
          <div className="relative aspect-16/9 rounded-xl overflow-hidden bg-gray-100 mb-3">
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#0A1D3F]/90 text-white backdrop-blur-xs">
              {course.board}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-xs font-semibold text-[#FF8A00]">
                Class {course.class}
              </span>
              <RatingBadge rating={course.rating} count={course.reviewCount} />
            </div>

            <h4 className="text-sm font-bold text-[#0A1D3F] line-clamp-1 group-hover:text-[#FF8A00] transition">
              {course.title}
            </h4>

            <div className="flex items-center gap-3 text-xs text-[#667085]">
              <span className="flex items-center gap-1">
                <Video className="w-3.5 h-3.5" />
                <span>{course.videoCount}+ Videos</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                <span>{course.testCount} Tests</span>
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-[#E6E8EC] flex items-center justify-between">
          <PriceDisplay
            price={course.price}
            originalPrice={course.originalPrice}
            discount={course.discount}
            size="sm"
          />

          <Link
            to={enrolled ? `/coaching/${course.id}` : `/coaching/${course.id}`}
            className="px-3 py-1.5 bg-[#0A1D3F] hover:bg-[#133C8B] text-white text-xs font-bold rounded-xl transition active:scale-95"
          >
            {enrolled ? "View Course" : "Details"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E6E8EC] p-3 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
      <div>
        <div className="relative aspect-16/9 rounded-xl overflow-hidden bg-gray-100 mb-2">
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
            <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-[#0A1D3F]/90 text-white backdrop-blur-xs">
              {course.category}
            </span>
            <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-[#FF8A00]/90 text-white backdrop-blur-xs">
              Class {course.class}
            </span>
          </div>

          {enrolled && (
            <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-[#17B26A] text-white flex items-center gap-1 shadow-sm">
              <CheckCircle2 className="w-2.5 h-2.5" />
              <span>Enrolled</span>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-[#667085]">
              <span className="flex items-center gap-1">
                <Video className="w-3 h-3 text-[#0A1D3F]" />
                <span>{course.videoCount}+ Videos</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3 text-[#FF8A00]" />
                <span>{course.testCount} Tests</span>
              </span>
            </div>

            <RatingBadge rating={course.rating} count={course.reviewCount} />
          </div>

          <Link to={`/coaching/${course.id}`} className="block">
            <h3 className="text-xs sm:text-sm font-bold text-[#0A1D3F] line-clamp-1 group-hover:text-[#FF8A00] transition">
              {course.title}
            </h3>
            <p className="text-[11px] text-[#667085] line-clamp-1 mt-0.5">
              {course.description}
            </p>
          </Link>
        </div>
      </div>

      <div className="mt-2.5 pt-2 border-t border-[#E6E8EC] flex items-center justify-between gap-2">
        <PriceDisplay
          price={course.price}
          originalPrice={course.originalPrice}
          discount={course.discount}
          size="sm"
        />

        <Link
          to={`/coaching/${course.id}`}
          className="px-3 py-1.5 bg-[#0A1D3F] hover:bg-[#133C8B] text-white text-xs font-bold rounded-xl transition active:scale-95 shadow-xs"
        >
          {enrolled ? "Continue" : "Explore"}
        </Link>
      </div>
    </div>
  );
};
