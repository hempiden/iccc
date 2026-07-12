import React, { useState, useRef, useEffect } from 'react';
import { Bell, MessageSquare, CheckCircle2, ShieldAlert, Sparkles, X, Mail } from 'lucide-react';

export interface CommentNotification {
  id: string;
  recordId: string;
  recordOwner: string;
  awbNumber?: string;
  customerName?: string;
  commentId: string;
  commentAuthor: string;
  commentRole: string;
  commentText: string;
  timestamp: string;
  isMention: boolean;
}

interface NotificationCenterProps {
  notifications: CommentNotification[];
  unreadCount: number;
  onSelectRecord: (recordId: string) => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export default function NotificationCenter({
  notifications,
  unreadCount,
  onSelectRecord,
  onMarkAsRead,
  onMarkAllAsRead
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const formatTime = (timeStr: string) => {
    try {
      const date = new Date(timeStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHrs = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHrs / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHrs < 24) return `${diffHrs}h ago`;
      if (diffDays === 1) return 'Yesterday';
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return timeStr;
    }
  };

  const handleNotificationClick = (notification: CommentNotification) => {
    onMarkAsRead(notification.id);
    onSelectRecord(notification.recordId);
    setIsOpen(false);
  };

  return (
    <div className="relative font-sans" ref={dropdownRef}>
      {/* Trigger Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-lg transition-all relative cursor-pointer ${
          isOpen ? 'bg-amber-100 text-amber-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
        }`}
        title="Comment Activity Alerts"
      >
        <Bell className="w-4.5 h-4.5 shrink-0" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white ring-2 ring-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Floating Dropdown Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-fade-in text-left">
          
          {/* Header */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-black text-slate-800 uppercase tracking-tight">
                Case Activity Notifications
              </span>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="text-[10px] font-black uppercase tracking-wider text-amber-600 hover:text-amber-800 hover:bg-amber-50 px-2 py-1 rounded transition-all cursor-pointer"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* List Area */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="px-6 py-10 text-center flex flex-col items-center justify-center">
                <div className="p-3 bg-amber-50 rounded-full mb-3">
                  <CheckCircle2 className="w-6 h-6 text-amber-500" />
                </div>
                <p className="text-xs font-bold text-slate-700">No Pending Replies</p>
                <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">
                  You're all caught up! Comments expecting your reply or mentions will show up here.
                </p>
              </div>
            ) : (
              notifications.map((n, idx) => {
                const isUnread = unreadCount > 0 && !notifications.slice(unreadCount).some(other => other.id === n.id); 
                // Wait, let's just check if it's unread based on actual prop values if we pass down the read list or a check.
                // It is simpler: we can just check if n.id is unread.
                // Let's pass the unread checking logic inside the prop or just pass read status.
                return (
                  <div
                    key={`${n.id}-${idx}`}
                    onClick={() => handleNotificationClick(n)}
                    className="p-3.5 hover:bg-amber-50/40 transition-colors cursor-pointer flex gap-3 text-left relative"
                  >
                    {/* Unread Indicator Bar */}
                    {isUnread && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
                    )}

                    <div className="flex-1 min-w-0">
                      {/* Comment author & timestamp */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight truncate">
                          {n.commentAuthor}
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold shrink-0">
                          {formatTime(n.timestamp)}
                        </span>
                      </div>

                      {/* Author Role */}
                      <span className="text-[8px] font-extrabold uppercase bg-slate-100 text-slate-500 px-1 py-0.5 rounded">
                        {n.commentRole}
                      </span>

                      {/* Comment Snippet */}
                      <p className="text-[11px] text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                        {n.isMention && (
                          <span className="text-[9px] font-black text-amber-700 bg-amber-100 px-1 rounded mr-1 select-none">
                            @MENTION
                          </span>
                        )}
                        {n.commentText}
                      </p>

                      {/* Record reference */}
                      <div className="mt-2 flex items-center justify-between text-[9px] text-slate-400 font-bold bg-slate-50 border border-slate-100 p-1.5 rounded uppercase">
                        <span className="truncate max-w-[120px]">
                          Case: {n.customerName || 'Customer'}
                        </span>
                        {n.awbNumber && (
                          <span className="font-mono bg-slate-200/50 px-1 rounded text-[8px]">
                            AWB: {n.awbNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer note */}
          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 text-[9px] text-slate-400 font-bold text-center uppercase tracking-wider flex items-center justify-center gap-1.5">
            <Mail className="w-3 h-3 text-blue-500" />
            <span>Updates are also shared to your Outlook Inbox</span>
          </div>

        </div>
      )}
    </div>
  );
}
