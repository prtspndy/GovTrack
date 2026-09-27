import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { notificationService } from '../../services/notificationService.js';
import { NotificationItem } from '../../types/index.js';
import { Bell, CheckCheck, Clock, FileText, CheckCircle2 } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    setLoading(true);
    const res = await notificationService.getAll();
    if (res.success && res.data) {
      setNotifications(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleMarkOne = async (id: string) => {
    await notificationService.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Notifications Center</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Live alerts on status changes, document verifications, and certificate approvals
            </p>
          </div>

          <button
            onClick={handleMarkAllRead}
            className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <CheckCheck className="w-4 h-4 text-blue-700" />
            Mark all read
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No notifications in your inbox.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => !n.isRead && handleMarkOne(n._id)}
                  className={`p-4 sm:p-5 flex items-start justify-between gap-4 hover:bg-slate-50 transition-colors ${
                    !n.isRead ? 'bg-blue-50/40' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        !n.isRead ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                      {n.request && (
                        <Link
                          to={`/citizen/requests/${(n.request as any)?._id || n.request}`}
                          className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:underline"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          View Associated Application →
                        </Link>
                      )}
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-400 shrink-0 font-mono whitespace-nowrap">
                    {new Date(n.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
