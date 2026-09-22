import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCircle2,
  GraduationCap,
  PlayCircle,
  BookOpen,
  Megaphone,
  Check,
  ChevronRight,
  ArrowLeft
} from "lucide-react";
import { notificationService } from "../../services/notificationService";
import { useToast } from "../../context/ToastContext";

const iconMap = {
  GraduationCap,
  PlayCircle,
  BookOpen,
  Megaphone,
  CheckCircle2,
};

export const NotificationsPage = () => {
  const navigate = useNavigate();
  const { showSuccess } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        setLoading(true);
        const data = await notificationService.getNotifications();
        setNotifications(data);
      } catch (err) {
        console.error("Notifs load error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifs();
  }, []);

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    const updated = await notificationService.getNotifications();
    setNotifications(updated);
    showSuccess("All marked as read");
  };

  const handleItemClick = async (item) => {
    if (!item.isRead) {
      await notificationService.markAsRead(item.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
    }
    if (item.link) {
      navigate(item.link);
    }
  };

  const unreadList = notifications.filter((n) => !n.isRead);

  return (
    <div className="max-w-2xl mx-auto space-y-3 sm:space-y-4 pt-1 sm:pt-2">
      {/* 1. Simple Clean Header */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-md bg-white border border-[#E6E8EC] hover:bg-gray-50 text-[#0A1D3F] transition cursor-pointer"
            title="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#0A1D3F] leading-tight">
              Notifications
            </h1>
            <p className="text-[11px] text-[#667085]">
              Updates, alerts & announcements
            </p>
          </div>
        </div>

        {unreadList.length > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#FF8A00] hover:text-[#E67A00] transition cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* 2. Simple Unified List (All Notifications) */}
      {loading ? (
        <div className="bg-white rounded-md border border-[#E6E8EC] divide-y divide-[#F0F2F5] overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-3.5 flex items-center gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-md bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 bg-gray-200 rounded w-2/5" />
                <div className="h-2.5 bg-gray-200 rounded w-4/5" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-md border border-[#E6E8EC] p-8 text-center space-y-2">
          <div className="w-10 h-10 rounded-md bg-gray-100 text-[#667085] flex items-center justify-center mx-auto">
            <Bell className="w-5 h-5 opacity-60" />
          </div>
          <h3 className="text-sm font-bold text-[#0A1D3F]">All Caught Up</h3>
          <p className="text-xs text-[#667085] max-w-xs mx-auto">
            You don't have any notifications at the moment.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-md border border-[#E6E8EC] divide-y divide-[#F0F2F5] shadow-2xs overflow-hidden">
          {notifications.map((item) => {
            const Icon = iconMap[item.icon] || Bell;

            return (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`p-3 sm:p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                  !item.isRead
                    ? "bg-amber-50/20 hover:bg-amber-50/40"
                    : "hover:bg-gray-50/80"
                }`}
              >
                {/* Minimal Icon */}
                <div
                  className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 text-xs ${
                    !item.isRead
                      ? "bg-[#FF8A00]/10 text-[#FF8A00]"
                      : "bg-gray-100 text-[#0A1D3F]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4
                      className={`text-xs sm:text-sm truncate ${
                        !item.isRead ? "font-bold text-[#0A1D3F]" : "font-medium text-gray-700"
                      }`}
                    >
                      {item.title}
                    </h4>
                    <span className="text-[11px] text-[#667085] shrink-0 font-normal">
                      {item.time}
                    </span>
                  </div>

                  <p className="text-xs text-[#667085] line-clamp-1 sm:line-clamp-2 mt-0.5 leading-relaxed font-normal">
                    {item.message}
                  </p>
                </div>

                {/* Unread dot or subtle arrow */}
                <div className="shrink-0 flex items-center self-center pl-1">
                  {!item.isRead ? (
                    <span className="w-2 h-2 rounded-full bg-[#FF8A00]" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
