import { useState, useEffect, useCallback } from 'react';

const BACKEND = 'http://localhost:8081';

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  // Start loading only if user is logged in, so the page shows a spinner immediately
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('token')));
  const [unreadCount, setUnreadCount] = useState(0);

  const getToken = () => localStorage.getItem('token');

  const fetchUnreadCount = useCallback(async () => {
    const t = getToken();
    if (!t) return;
    try {
      const res = await fetch(`${BACKEND}/api/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count);
      }
    } catch {
      // ignore network errors silently
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    const t = getToken();
    if (!t) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/notifications`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.read).length);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id) => {
    const t = getToken();
    if (!t) return;
    try {
      await fetch(`${BACKEND}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${t}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const t = getToken();
    if (!t) return;
    try {
      await fetch(`${BACKEND}/api/notifications/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${t}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  }, []);

  const deleteNotification = useCallback(async (id) => {
    const t = getToken();
    if (!t) return;
    try {
      const res = await fetch(`${BACKEND}/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  return { notifications, unreadCount, loading, fetchNotifications, markAsRead, markAllAsRead, deleteNotification };
}
