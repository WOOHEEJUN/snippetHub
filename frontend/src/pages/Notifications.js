import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../css/Notifications.css';

const Notifications = () => {
  const { getAuthHeaders } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/notifications', {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setNotifications(data.data.content); // Assuming data.data.content holds the array of notifications
    } catch (err) {
      setError('알림을 불러오는 데 실패했습니다.');
      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        // 알림 상태 업데이트
        setNotifications(prevNotifications =>
          prevNotifications.map(notif =>
            notif.id === notificationId ? { ...notif, read: true } : notif
          )
        );
      } else {
        
      }
    } catch (err) {
      
    }
  };

  if (loading) {
    return <div className="notifications-container">알림을 불러오는 중...</div>;
  }

  if (error) {
    return <div className="notifications-container error-message">{error}</div>;
  }

  return (
    <div className="notifications-container">
      <h2>내 알림</h2>
      {notifications.length === 0 ? (
        <p className="no-notifications">새로운 알림이 없습니다.</p>
      ) : (
        <ul className="notification-list">
          {notifications.map(notification => (
            <li
              key={notification.id}
              className={`notification-item ${notification.read ? 'read' : 'unread'}`}
              onClick={() => !notification.read && markAsRead(notification.id)}
            >
              <div className="notification-header">
                <span className="notification-type">{notification.type}</span>
                <span className="notification-date">{new Date(notification.createdAt).toLocaleString()}</span>
              </div>
              <div className="notification-content">
                <p className="notification-title">{notification.title}</p>
                <p className="notification-message">{notification.message}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Notifications;
