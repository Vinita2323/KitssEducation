import React from "react";
import { Link } from "react-router-dom";
import {
  Video,
  BookOpen,
  Clock,
  GraduationCap,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  User,
  CheckCircle2
} from "lucide-react";

export const CourseCard = ({
  course,
  showJoinAction = false,
  onJoinClick,
}) => {
  if (!course) return null;

  const {
    id,
    title,
    subtitle,
    description,
    board,
    class: gradeClass,
    subjects = [],
    teacher,
    lecturesCount,
    booksCount,
    duration,
    status = "Active",
    thumbnail,
    isEnrolled,
    progressPercentage = 0,
    completedLectures = 0,
  } = course;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs hover:border-slate-300 hover:shadow-md flex flex-col h-full transition-all duration-200 group">
      {/* Course Thumbnail & Status Overlays */}
      <div className="relative aspect-16/9 w-full bg-slate-900 overflow-hidden">
        <img
          src={
            thumbnail ||
            "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&auto=format&fit=crop&q=80"
          }
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-900/80 text-white backdrop-blur-md border border-white/15 shadow-xs">
              {board}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/90 text-slate-900 backdrop-blur-md border border-slate-200/40 shadow-xs">
              {gradeClass}
            </span>
          </div>

          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider shadow-xs ${
              status === "Active"
                ? "bg-emerald-600 text-white"
                : "bg-amber-600 text-white"
            }`}
          >
            {status}
          </span>
        </div>

        {/* Enrolled Progress Bar Overlay if already joined */}
        {isEnrolled && (
          <div className="absolute bottom-2 left-2 right-2 bg-slate-900/85 backdrop-blur-md rounded-lg p-1.5 flex items-center justify-between text-white text-[10px] border border-white/10">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-medium text-white/90">
                {progressPercentage}% Completed ({completedLectures} lecs)
              </span>
            </div>
            <div className="w-12 h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Course Card Body */}
      <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
        <div className="space-y-2">
          {/* Subjects Tag Pills */}
          <div className="flex items-center gap-1 flex-wrap">
            {subjects.map((sub, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200/70"
              >
                {sub}
              </span>
            ))}
          </div>

          {/* Title & Short Description */}
          <div>
            <h3 className="font-semibold text-sm sm:text-base text-slate-900 leading-snug line-clamp-1 group-hover:text-slate-700 transition-colors tracking-tight">
              {title}
            </h3>
            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 leading-relaxed">
              {description || subtitle}
            </p>
          </div>

          {/* Faculty / Instructor */}
          {teacher && (
            <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/70 text-[11px] text-slate-700">
              <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                <User className="w-3 h-3" />
              </div>
              <span className="font-medium truncate">{teacher}</span>
            </div>
          )}

          {/* Quick Metrics (Lectures, Books, Duration) */}
          <div className="grid grid-cols-3 gap-1 py-1.5 px-2 bg-slate-50/80 rounded-lg text-center border border-slate-200/60">
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase font-semibold text-slate-500 flex items-center gap-1">
                <Video className="w-2.5 h-2.5 text-slate-600" /> Lectures
              </span>
              <span className="text-xs font-semibold text-slate-800">
                {lecturesCount || 0}
              </span>
            </div>

            <div className="flex flex-col items-center border-x border-slate-200/80">
              <span className="text-[9px] uppercase font-semibold text-slate-500 flex items-center gap-1">
                <BookOpen className="w-2.5 h-2.5 text-amber-600" /> Books
              </span>
              <span className="text-xs font-semibold text-slate-800">
                {booksCount || 0}
              </span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase font-semibold text-slate-500 flex items-center gap-1">
                <Clock className="w-2.5 h-2.5 text-emerald-600" /> Duration
              </span>
              <span className="text-xs font-semibold text-slate-800">
                {duration || "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Card CTA Actions */}
        <div className="pt-1">
          {showJoinAction ? (
            <button
              type="button"
              onClick={() => onJoinClick && onJoinClick(course)}
              className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors active:scale-[0.99] cursor-pointer"
            >
              <span>{isEnrolled ? "Already Joined" : "Join Course"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link
                to={`/coaching/${id}`}
                className="flex-1 py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors active:scale-[0.99]"
              >
                <span>View Course</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              {isEnrolled && (
                <Link
                  to={`/coaching/${id}/dashboard`}
                  className="py-2 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs flex items-center justify-center transition border border-emerald-200/50"
                  title="Open Dashboard"
                >
                  Learning
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
