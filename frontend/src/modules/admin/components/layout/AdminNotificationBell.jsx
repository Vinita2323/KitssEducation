import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Building2,
  GraduationCap,
  Receipt,
  ExternalLink,
  Clock,
  X,
  ChevronRight,
  RefreshCw,
  Loader2,
  Sparkles
} from 'lucide-react';
import { notificationService } from '../../../user/services/notificationService';
import { useToast } from '../../../user/context/ToastContext';

function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function getNotificationIcon(title, category) {
  const t = (title || '').toLowerCase();
  if (t.includes('franchise')) {
    return <Building2 className="w-4 h-4 text-[#FF8A00]" />;
  }
  if (t.includes('registration') || t.includes('student') || t.includes('admission')) {
    return <GraduationCap className="w-4 h-4 text-blue-600" />;
  }
  if (t.includes('refund') || t.includes('payment') || t.includes('order')) {
    return <Receipt className="w-4 h-4 text-amber-600" />;
  }
  return <Bell className="w-4 h-4 text-slate-600" />;
}

export function AdminNotificationBell() {
  const navigate = useNavigate();
  const { showSuccess } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [through, setThrough] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await notificationService.list(1);
      setNotifications(res.data || []);
      setUnreadCount(res.meta?.unreadCount ?? 0);
      setThrough(res.meta?.through || new Date().toISOString());
    } catch {
      // keep existing state
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(() => fetchNotifications(true), 20000);
    const handleChanged = () => fetchNotifications(true);
    window.addEventListener('kitss:notifications-changed', handleChanged);
    window.addEventListener('focus', handleChanged);
    return () => {
      clearInterval(timer);
      window.removeEventListener('kitss:notifications-changed', handleChanged);
      window.removeEventListener('focus', handleChanged);
    };
  }, [fetchNotifications]);

  // Click outside and escape key handling
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleEscape = e => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    if (busy || unreadCount === 0) return;
    setBusy(true);
    try {
      await notificationService.markAllAsRead(through);
      setNotifications(v => v.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      showSuccess('All notifications marked as read');
    } catch {
      // ignore
    } finally {
      setBusy(false);
    }
  };

  const handleItemClick = async item => {
    setIsOpen(false);
    try {
      if (!item.isRead) {
        await notificationService.markAsRead(item.id);
        setNotifications(v => v.map(n => (n.id === item.id ? { ...n, isRead: true } : n)));
        setUnreadCount(c => Math.max(0, c - 1));
      }
    } catch {
      // ignore
    }
    if (item.link) {
      navigate(item.link);
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        aria-label={`Admin notifications, ${unreadCount} unread`}
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => {
          setIsOpen(v => !v);
          if (!isOpen) fetchNotifications(true);
        }}
        className="relative p-2 rounded-full text-blue-100 hover:text-white hover:bg-white/10 transition cursor-pointer flex items-center justify-center border border-white/15 bg-white/5"
      >
        <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[1.125rem] h-[1.125rem] px-1 bg-[#FF8A00] text-white font-extrabold text-[10px] rounded-full flex items-center justify-center shadow-xs ring-2 ring-[#0A1D3F] animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150 text-left">
          {/* Header */}
          <div className="p-3.5 sm:p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[#0A1D3F]">Notifications</span>
              {unreadCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FF8A00]/10 text-[#FF8A00] border border-[#FF8A00]/20">
                  {unreadCount} new
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500">
                  All caught up
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleMarkAllRead}
                  className="p-1 px-2 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  title="Mark all notifications as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mark read</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => fetchNotifications(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                title="Refresh notifications"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 sm:max-h-96 overflow-y-auto divide-y divide-slate-100">
            {loading && !notifications.length ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#FF8A00]" />
                <p className="text-xs">Checking alerts...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2.5">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="font-bold text-xs text-[#0A1D3F]">No notifications yet</p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                  You will be notified here when users submit franchise requests, student registrations, or order refunds.
                </p>
              </div>
            ) : (
              notifications.map(item => {
                const isUnread = !item.isRead;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`p-3.5 transition flex items-start gap-3 cursor-pointer group ${
                      isUnread
                        ? 'bg-blue-50/40 hover:bg-blue-50/70'
                        : 'hover:bg-slate-50/80 bg-white'
                    }`}
                  >
                    {/* Icon container */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isUnread
                          ? 'bg-white shadow-2xs border border-blue-200'
                          : 'bg-slate-100 border border-slate-200 text-slate-500'
                      }`}
                    >
                      {getNotificationIcon(item.title, item.category)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-xs truncate ${isUnread ? 'font-bold text-[#0A1D3F]' : 'font-medium text-slate-700'}`}>
                          {item.title}
                        </p>
                        <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                          {formatRelativeTime(item.publishedAt || item.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                        {item.message}
                      </p>
                      {item.link && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 group-hover:underline mt-1">
                          <span>Open action</span>
                          <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      )}
                    </div>

                    {/* Unread indicator dot */}
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-[#FF8A00] shrink-0 mt-1.5 shadow-xs" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <Link
              to="/admin/notifications"
              onClick={() => setIsOpen(false)}
              className="text-[#0A1D3F] hover:text-[#FF8A00] font-bold inline-flex items-center gap-1 transition"
            >
              <span>Broadcast announcements</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
            <span className="text-slate-400 text-[10px]">Real-time audit alerts</span>
          </div>
        </div>
      )}
    </div>
  );
}
