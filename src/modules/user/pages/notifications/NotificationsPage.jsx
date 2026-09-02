import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCircle2,
  GraduationCap,
  PlayCircle,
  BookOpen,
  Megaphone,
  Check,
  ChevronRight
} from "lucide-react";
import { notificationService } from "../../services/notificationService";
import { useToast } from "../../context/ToastContext";
import { SkeletonLoader, EmptyState } from "../../components/common/EmptyState";

const iconMap = {
  GraduationCap,
  PlayCircle,
  BookOpen,
  Megaphone,
  CheckCircle2
};

export const NotificationsPage = () => {
  const navigate = useNavigate();
  const { showSuccess } = useToast();
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'unread' | 'announcements'
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
    showSuccess("All notifications marked as read.");
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
  const announcementsList = notifications.filter((n) => n.category === "announcement");

  const filtered =
    activeTab === "unread"
      ? unreadList
      : activeTab === "announcements"
      ? announcementsList
      : notifications;

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0A1D3F] tracking-tight">
            Notifications Center
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] mt-0.5">
            Stay updated with course announcements, exam results & library items
          </p>
        </div>

        {unreadList.length > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="flex items-center gap-1 text-xs font-bold text-[#FF8A00] hover:underline"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E6E8EC]">
        {[
          { id: "all", label: "All", count: notifications.length },
          { id: "unread", label: "Unread", count: unreadList.length },
          { id: "announcements", label: "Announcements", count: announcementsList.length },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-center text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition duration-200 touch-target ${
                isActive
                  ? "border-[#0A1D3F] text-[#0A1D3F]"
                  : "border-transparent text-[#667085] hover:text-[#0A1D3F]"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isActive ? "bg-[#0A1D3F] text-white" : "bg-gray-100 text-gray-700"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Notification Items */}
      {loading ? (
        <SkeletonLoader type="card" count={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="All Caught Up!"
          description="You have no notifications in this category."
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((item) => {
            const Icon = iconMap[item.icon] || Bell;

            return (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`p-4 rounded-2xl border transition-all duration-200 flex items-start gap-3.5 cursor-pointer ${
                  !item.isRead
                    ? "bg-white border-[#0A1D3F]/20 shadow-xs"
                    : "bg-[#F7F8FA] border-[#E6E8EC] opacity-80 hover:opacity-100"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <h4
                      className={`text-xs sm:text-sm font-bold truncate ${
                        !item.isRead ? "text-[#0A1D3F]" : "text-gray-700"
                      }`}
                    >
                      {item.title}
                    </h4>
                    <span className="text-[10px] text-[#667085] whitespace-nowrap">
                      {item.time}
                    </span>
                  </div>

                  <p className="text-xs text-[#667085] leading-relaxed line-clamp-2">
                    {item.message}
                  </p>
                </div>

                {!item.isRead && (
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF8A00] shrink-0 mt-1.5" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
