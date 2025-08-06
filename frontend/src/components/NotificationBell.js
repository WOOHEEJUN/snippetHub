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
    const token = localStorage.getItem('accessToken'); // accessToken으로 변경
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
        console.log('fetchNotifications 응답:', data);
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
        console.log('fetchUnreadCount 응답:', count);
        setUnreadCount(count);
      }
    } catch (error) {
      console.error('읽지 않은 알림 개수 가져오기 실패:', error);
    }
  };

  // 알림 읽음 처리 및 이동
  const handleNotificationClick = async (notification) => {
    console.log('handleNotificationClick 호출됨. 알림:', notification);
    if (!notification.isRead) {
      try {
        const readResponse = await fetch(`/api/notifications/${notification.id}/read`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          credentials: 'include'
        });
        if (readResponse.ok) {
          console.log('알림 읽음 처리 성공!');
        } else {
          console.error('알림 읽음 처리 실패: ', readResponse.status, readResponse.statusText);
        }
        // 읽음 처리 후 목록/카운트 갱신
        fetchNotifications();
        fetchUnreadCount();
      } catch (error) {
        console.error('알림 읽음 처리 실패:', error);
      }
    }
    // 게시글로 이동 (알림에 postId, snippetId, commentId 등 포함되어야 함)
    if (notification.targetType === 'POST' && notification.targetId) {
      const path = `/board/${notification.targetId}`;
      console.log('게시글로 이동:', path);
      navigate(path);
    } else if (notification.targetType === 'SNIPPET' && notification.targetId) {
      const path = `/snippets/${notification.targetId}`;
      console.log('스니펫으로 이동:', path);
      navigate(path);
    } else if (notification.targetType === 'COMMENT' && notification.targetId && notification.parentId) {
      // 예시: 댓글 알림이면 해당 게시글/스니펫으로 이동
      const path = `/board/${notification.parentId}#comment-${notification.targetId}`;
      console.log('댓글이 있는 게시글로 이동:', path);
      navigate(path);
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
    <div className="app-notification-bell">
      <div className="app-bell-container" onClick={() => setShowDropdown(!showDropdown)}>
        <FaBell className="app-bell-icon" />
        {unreadCount > 0 && (
          <span className="app-notification-badge">{unreadCount}</span>
        )}
      </div>
      {showDropdown && (
        <div className="app-notification-dropdown">
          <div className="app-notification-header">
            <h3>알림</h3>
            {unreadCount > 0 && (
              <button 
                className="app-mark-all-read-btn"
                onClick={markAllAsRead}
              >
                모두 읽음 처리
              </button>
            )}
          </div>
          <div className="app-notification-list">
            {loading ? (
              <div className="app-loading">로딩 중...</div>
            ) : notifications.length === 0 ? (
              <div className="app-no-notifications">알림이 없습니다.</div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`app-notification-item ${!notification.isRead ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="app-notification-content">
                    <p className="app-notification-message">{notification.message}</p>
                    <span className="app-notification-time">
                      {formatDate(notification.createdAt)}
                    </span>
                  </div>
                  {!notification.isRead && <div className="app-unread-indicator" />}
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