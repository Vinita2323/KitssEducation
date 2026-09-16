import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  GraduationCap,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  User
} from "lucide-react";
import { adminService } from "../services/adminService";
import { PrimaryButton } from "../../user/components/common/PrimaryButton";

export const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await adminService.getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error("Error loading admin stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-[#E6E8EC]" />
          ))}
        </div>
        <div className="h-64 bg-white rounded-2xl border border-[#E6E8EC]" />
      </div>
    );
  }

  const statCards = [
    {
      label: "Partner Colleges",
      value: stats?.totalColleges || 0,
      sub: `${stats?.activeColleges || 0} active institutions`,
      icon: Building2,
      color: "text-[#0A1D3F]",
      bg: "bg-blue-50",
    },
    {
      label: "Available Courses",
      value: stats?.totalCourses || 0,
      sub: `${stats?.activeCourses || 0} active programs`,
      icon: GraduationCap,
      color: "text-[#FF8A00]",
      bg: "bg-orange-50",
    },
    {
      label: "Total Applications",
      value: stats?.totalApplications || 0,
      sub: "Student enquiries",
      icon: FileText,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "New Enquiries",
      value: stats?.statusCounts?.New || 0,
      sub: "Awaiting counselor action",
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0A1D3F] tracking-tight">
            Franchise Admission Overview
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] mt-0.5">
            Manage partner universities, course catalog, and incoming student applications.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/colleges"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0A1D3F] hover:bg-[#133C8B] text-white text-xs font-bold transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Partner College</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E6E8EC] shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#667085]">{card.label}</span>
                <div className={`w-9 h-9 rounded-xl ${card.bg} ${card.color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-[#0A1D3F] tracking-tight">
                  {card.value}
                </div>
                <div className="text-[11px] text-[#667085] mt-0.5 font-medium">
                  {card.sub}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Application Status Breakdown */}
      <div className="bg-white p-5 rounded-2xl border border-[#E6E8EC] shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-[#0A1D3F] uppercase tracking-wider">
          Application Funnel Status
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "New", count: stats?.statusCounts?.New || 0, color: "border-blue-200 bg-blue-50/50 text-blue-700" },
            { label: "Contacted", count: stats?.statusCounts?.Contacted || 0, color: "border-amber-200 bg-amber-50/50 text-amber-700" },
            { label: "In Process", count: stats?.statusCounts?.["In Process"] || 0, color: "border-purple-200 bg-purple-50/50 text-purple-700" },
            { label: "Approved", count: stats?.statusCounts?.Approved || 0, color: "border-emerald-200 bg-emerald-50/50 text-emerald-700" },
            { label: "Rejected", count: stats?.statusCounts?.Rejected || 0, color: "border-rose-200 bg-rose-50/50 text-rose-700" },
          ].map((s) => (
            <div key={s.label} className={`p-3 rounded-xl border ${s.color} text-center`}>
              <div className="text-lg font-black">{s.count}</div>
              <div className="text-xs font-semibold mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Applications Section */}
      <div className="bg-white rounded-2xl border border-[#E6E8EC] shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#E6E8EC] flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#0A1D3F]">
              Recent Admission Applications
            </h3>
            <p className="text-xs text-[#667085] mt-0.5">
              Latest applications received from students.
            </p>
          </div>

          <Link
            to="/admin/applications"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#FF8A00] hover:text-[#E67C00] transition"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {stats?.recentApplications && stats.recentApplications.length > 0 ? (
          <div className="divide-y divide-[#F0F2F5] overflow-x-auto">
            {stats.recentApplications.map((app) => (
              <div
                key={app.applicationId || app._id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/60 transition text-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#FF8A00] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-[#0A1D3F]">
                        {app.studentDetails?.fullName}
                      </span>
                      <span className="font-mono text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                        {app.applicationId}
                      </span>
                    </div>
                    <p className="text-[#667085] mt-0.5">
                      {app.courseId?.courseName || "Course"} • {app.collegeId?.name || "College"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:self-center self-end">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      app.status === "New"
                        ? "bg-blue-100 text-blue-800"
                        : app.status === "Contacted"
                        ? "bg-amber-100 text-amber-800"
                        : app.status === "Approved"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {app.status}
                  </span>

                  <Link
                    to="/admin/applications"
                    className="text-xs font-bold text-[#0A1D3F] hover:text-[#FF8A00] bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition"
                  >
                    Manage
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-[#667085]">
            No applications submitted yet. Once a student applies for a college, it will appear here.
          </div>
        )}
      </div>
    </div>
  );
};
