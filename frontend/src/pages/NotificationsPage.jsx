import { useEffect } from 'react';
import { Bell, CheckCheck, Ticket, CalendarCheck, CalendarX, AlertCircle, Trash2, Sparkles } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const TYPE_ICON = {
  TICKET_CREATED: <AlertCircle className="h-5 w-5 text-yellow-400" />,
  TICKET_UPDATED: <Ticket className="h-5 w-5 text-blue-400" />,
  BOOKING_CREATED: <CalendarCheck className="h-5 w-5 text-yellow-400" />,
  BOOKING_APPROVED: <CalendarCheck className="h-5 w-5 text-green-400" />,
  BOOKING_REJECTED: <CalendarX className="h-5 w-5 text-red-400" />,
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationsPage() {
  const { notifications, loading, fetchNotifications, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications();

  const unread = notifications.filter((n) => !n.read).length;
  const read = notifications.length - unread;

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fffdfa] via-white to-[#fff7e6] text-[#222222] flex flex-col">
      <Navbar />
      <div className="max-w-3xl mx-auto w-full pt-28 px-4 pb-12 flex-1">
        <div className="bg-white/95 backdrop-blur rounded-3xl border border-[#f4e2b8] shadow-lg p-6 md:p-7 mb-6">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#fff4d8] flex items-center justify-center border border-[#f6de9a]">
                <Bell className="h-5 w-5 text-sliit-gold" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-[#222222]">Notifications</h1>
                <p className="text-sm text-gray-500">Stay updated with your campus activity</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-[#8a6b22] bg-[#fff7e2] border border-[#f4e1ad] px-3 py-1.5 rounded-full font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              Live Updates
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-2">
            <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5">
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-xl font-bold text-[#222222]">{notifications.length}</p>
            </div>
            <div className="rounded-xl border border-[#f6de9a] bg-[#fff9ea] px-3 py-2.5">
              <p className="text-xs text-gray-500">Unread</p>
              <p className="text-xl font-bold text-[#8a6b22]">{unread}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5">
              <p className="text-xs text-gray-500">Read</p>
              <p className="text-xl font-bold text-[#222222]">{read}</p>
            </div>
          </div>

          {unread > 0 && (
            <button
              onClick={markAllAsRead}
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-sliit-gold transition-colors"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all as read
            </button>
          )}
        </div>

        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-sliit-gold border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-500 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <Bell className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-lg">No notifications yet</p>
          </div>
        )}

        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.read && markAsRead(n.id)}
              className={`flex items-start gap-4 p-4 rounded-2xl border transition-all bg-white shadow-sm
                ${n.read
                  ? 'border-gray-200 opacity-80'
                  : 'border-sliit-gold/30 hover:border-sliit-gold/60 hover:shadow-md'
                }`}
            >
              <div className="mt-0.5 shrink-0">
                {TYPE_ICON[n.type] ?? <Bell className="h-5 w-5 text-gray-400" />}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className={`text-sm ${n.read ? 'text-gray-500' : 'text-[#222222]'}`}>
                  {n.message}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs text-gray-400">{timeAgo(n.createdAt)}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{String(n.type || 'notice').replace('_', ' ')}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(n.id);
                }}
                className="shrink-0 p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Delete notification"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              {!n.read && <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-sliit-gold shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-[#f4e6c0] bg-[#fffdfa]">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-xs text-gray-500">
          Tip: click a notification card to mark it as read. Use the trash icon to remove items you no longer need.
        </div>
      </div>
      <Footer />
    </div>
  );
}
