import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, X, Clock, ExternalLink } from 'lucide-react';
import { notificationService } from '../../../services/notificationService';
import { useAuth } from '../../../context/AuthContext';
import styles from './NotificationBell.module.css';

export default function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Poll unread count every 45s when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;
    async function fetchCount() {
      try {
        const data = await notificationService.getUnreadCount();
        if (isMounted && data && typeof data.count === 'number') {
          setUnreadCount(data.count);
        }
      } catch {
        // Silently ignore background polling errors
      }
    }

    fetchCount();
    const interval = setInterval(fetchCount, 45000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = async () => {
    if (!isOpen) {
      setIsLoading(true);
      try {
        const data = await notificationService.getNotifications({ limit: 15 });
        if (data && data.notifications) {
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (err) {
        console.error('Failed to load notifications:', err);
      } finally {
        setIsLoading(false);
      }
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (e, notif) => {
    e.stopPropagation();
    if (notif.is_read) return;

    try {
      await notificationService.markAsRead(notif.id);
      setNotifications(prev =>
        prev.map(n => n.id === notif.id ? { ...n, is_read: 1 } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all read:', err);
    }
  };

  const handleDismiss = async (e, notifId) => {
    e.stopPropagation();
    try {
      await notificationService.dismiss(notifId);
      setNotifications(prev => prev.filter(n => n.id !== notifId));
    } catch (err) {
      console.error('Error dismissing notification:', err);
    }
  };

  const handleClickNotification = async (notif) => {
    if (!notif.is_read) {
      await notificationService.markAsRead(notif.id).catch(() => {});
      setNotifications(prev =>
        prev.map(n => n.id === notif.id ? { ...n, is_read: 1 } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    setIsOpen(false);

    // Contextual routing based on entity type
    if (notif.entity_type === 'booking') {
      navigate('/my-bookings');
    } else if (notif.entity_type === 'equipment' && notif.entity_id) {
      navigate(`/equipment/${notif.entity_id}`);
    } else {
      navigate('/my-bookings');
    }
  };

  const formatTimeAgo = (dateStr) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className={styles.wrapper} ref={dropdownRef}>
      <button
        type="button"
        className={styles.bellBtn}
        onClick={handleToggle}
        aria-label="Open notifications"
        aria-expanded={isOpen}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className={styles.badge}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropHeader}>
            <h4 className={styles.dropTitle}>Notifications</h4>
            {unreadCount > 0 && (
              <button
                type="button"
                className={styles.markAllBtn}
                onClick={handleMarkAllRead}
              >
                Mark all read
              </button>
            )}
          </div>

          {isLoading ? (
            <div className={styles.empty}>Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className={styles.empty}>No notifications right now.</div>
          ) : (
            <ul className={styles.list}>
              {notifications.map((notif) => (
                <li
                  key={notif.id}
                  className={`${styles.item} ${!notif.is_read ? styles.itemUnread : ''}`}
                  onClick={() => handleClickNotification(notif)}
                >
                  {!notif.is_read && <span className={styles.unreadDot} />}
                  <div className={styles.content}>
                    <div className={styles.itemTitle}>{notif.title}</div>
                    <div className={styles.itemMessage}>{notif.message}</div>
                    <div className={styles.itemTime}>{formatTimeAgo(notif.created_at)}</div>
                  </div>
                  <button
                    type="button"
                    className={styles.dismissBtn}
                    onClick={(e) => handleDismiss(e, notif.id)}
                    title="Dismiss"
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

