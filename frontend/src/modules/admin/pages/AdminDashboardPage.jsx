import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  Building2,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  ShieldCheck,
  User
} from "lucide-react";
import { adminService } from "../services/adminService";

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
      label: "Approved Universities",
      value: stats?.totalUniversities || 0,
      sub: `${stats?.activeUniversities || 0} active providers`,
      icon: GraduationCap,
      color: "text-[#0A1D3F]",
      bg: "bg-blue-50",
      link: "/admin/universities",
    },
    {
      label: "Colleges & Institutes",
      value: stats?.totalColleges || 0,
      sub: `${stats?.activeColleges || 0} active institutions`,
      icon: Building2,
      color: "text-[#FF8A00]",
      bg: "bg-orange-50",
      link: "/admin/colleges",
    },
    {
      label: "Franchise Requests",
      value: stats?.totalFranchiseRegistrations || 0,
      sub: `${stats?.franchiseStatusCounts?.Pending || 0} pending review`,
      icon: ShieldCheck,
      color: "text-amber-600",
      bg: "bg-amber-50",
      link: "/admin/franchise-requests",
    },
    {
      label: "Student Admissions",
      value: stats?.totalApplications || 0,
      sub: `${stats?.applicationStatusCounts?.New || 0} new enquiries`,
      icon: FileText,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      link: "/admin/applications",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0A1D3F] tracking-tight">
            Franchise & Campus Management Overview
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] mt-0.5">
            Manage accredited universities, colleges, franchise registration requests, and student admissions.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/admin/universities"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#E6E8EC] hover:bg-gray-50 text-[#0A1D3F] text-xs font-bold transition shadow-2xs"
          >
            <GraduationCap className="w-4 h-4 text-[#0A1D3F]" />
            <span>Manage Universities</span>
          </Link>
          <Link
            to="/admin/franchise-requests"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0A1D3F] hover:bg-[#133C8B] text-white text-xs font-bold transition shadow-xs"
          >
            <ShieldCheck className="w-4 h-4 text-[#FF8A00]" />
            <span>Review Franchises ({stats?.franchiseStatusCounts?.Pending || 0})</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              to={card.link}
              key={card.label}
              className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E6E8EC] shadow-2xs hover:shadow-md transition-all space-y-3 block"
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
                <div className="text-[11px] text-[#667085] mt-0.5 font-medium flex items-center justify-between">
                  <span>{card.sub}</span>
                  <ArrowRight className="w-3 h-3 text-gray-400" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Franchise Requests Breakdown */}
      <div className="bg-white p-5 rounded-2xl border border-[#E6E8EC] shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#0A1D3F] uppercase tracking-wider">
            Franchise Application Pipeline
          </h3>
          <Link
            to="/admin/franchise-requests"
            className="text-xs font-bold text-[#FF8A00] hover:underline flex items-center gap-1"
          >
            <span>Open Franchise Suite</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              label: "Pending Review",
              count: stats?.franchiseStatusCounts?.Pending || 0,
              color: "border-amber-200 bg-amber-50/60 text-amber-800",
            },
            {
              label: "Approved Franchises",
              count: stats?.franchiseStatusCounts?.Approved || 0,
              color: "border-emerald-200 bg-emerald-50/60 text-emerald-800",
            },
            {
              label: "Rejected Applications",
              count: stats?.franchiseStatusCounts?.Rejected || 0,
              color: "border-rose-200 bg-rose-50/60 text-rose-800",
            },
          ].map((s) => (
            <div key={s.label} className={`p-3.5 rounded-xl border ${s.color} text-center`}>
              <div className="text-xl font-black">{s.count}</div>
              <div className="text-xs font-semibold mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Franchise Registrations Section */}
      <div className="bg-white rounded-2xl border border-[#E6E8EC] shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#E6E8EC] flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#0A1D3F]">
              Recent Franchise Registrations
            </h3>
            <p className="text-xs text-[#667085] mt-0.5">
              Latest applications received under university-college hierarchy.
            </p>
          </div>

          <Link
            to="/admin/franchise-requests"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#FF8A00] hover:text-[#E67C00] transition"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {stats?.recentFranchiseRegistrations && stats.recentFranchiseRegistrations.length > 0 ? (
          <div className="divide-y divide-[#F0F2F5] overflow-x-auto">
            {stats.recentFranchiseRegistrations.map((fran) => (
              <div
                key={fran.applicationId || fran._id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/60 transition text-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#FF8A00] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#0A1D3F]">
                        {fran.applicationId}
                      </span>
                      <span className="font-semibold text-[#0A1D3F]">
                        • {fran.contactPerson}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#64748B] mt-0.5">
                      {fran.collegeId?.name} (under {fran.universityId?.name})
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      fran.status === "Approved"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : fran.status === "Rejected"
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {fran.status}
                  </span>

                  <Link
                    to="/admin/franchise-requests"
                    className="p-1 text-gray-400 hover:text-[#0A1D3F] transition"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-gray-400">
            No franchise applications recorded yet.
          </div>
        )}
      </div>
    </div>
  );
};
