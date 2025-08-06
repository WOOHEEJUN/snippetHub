import React, { useState, useEffect } from 'react';
import { FaBell } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './NotificationBell.css';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  // 알림 목록 가져오기
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications', {
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('알림 가져오기 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 읽지 않은 알림 개수 가져오기
  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications/count', {
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      if (response.ok) {
        const count = await response.json();
        setUnreadCount(count);
      }
    } catch (error) {
      console.error('읽지 않은 알림 개수 가져오기 실패:', error);
    }
  };

  // 알림 읽음 처리 및 이동
  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await fetch(`/api/notifications/${notification.id}/read`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          credentials: 'include'
        });
        // 읽음 처리 후 목록/카운트 갱신
        fetchNotifications();
        fetchUnreadCount();
      } catch (error) {
        console.error('알림 읽음 처리 실패:', error);
      }
    }
    // 게시글로 이동 (알림에 postId, snippetId, commentId 등 포함되어야 함)
    if (notification.targetType === 'POST' && notification.targetId) {
      navigate(`/board/${notification.targetId}`);
    } else if (notification.targetType === 'SNIPPET' && notification.targetId) {
      navigate(`/snippets/${notification.targetId}`);
    } else if (notification.targetType === 'COMMENT' && notification.targetId && notification.parentId) {
      // 예시: 댓글 알림이면 해당 게시글/스니펫으로 이동
      navigate(`/board/${notification.parentId}#comment-${notification.targetId}`);
    }
    // 필요시 다른 타입도 추가
  };

  // 모든 알림 읽음 처리
  const markAllAsRead = async () => {
    try {
      await Promise.all(
        notifications.filter(n => !n.isRead).map(n =>
          fetch(`/api/notifications/${n.id}/read`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            credentials: 'include'
          })
        )
      );
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error('모든 알림 읽음 처리 실패:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간 전`;
    return date.toLocaleDateString();
  };

  return (
    <div className="notification-bell">
      <div className="bell-container" onClick={() => setShowDropdown(!showDropdown)}>
        <FaBell className="bell-icon" />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </div>
      {showDropdown && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>알림</h3>
            {unreadCount > 0 && (
              <button 
                className="mark-all-read-btn"
                onClick={markAllAsRead}
              >
                모두 읽음 처리
              </button>
            )}
          </div>
          <div className="notification-list">
            {loading ? (
              <div className="loading">로딩 중...</div>
            ) : notifications.length === 0 ? (
              <div className="no-notifications">알림이 없습니다.</div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="notification-content">
                    <p className="notification-message">{notification.message}</p>
                    <span className="notification-time">
                      {formatDate(notification.createdAt)}
                    </span>
                  </div>
                  {!notification.isRead && <div className="unread-indicator" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
implementation 'org.springframework.boot:spring-boot-starter-data-jpa'