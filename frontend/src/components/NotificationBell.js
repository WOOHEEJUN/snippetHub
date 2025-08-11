import React, { useState, useEffect } from 'react';
import { FaBell } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import webSocketService from '../services/WebSocketService';
import './NotificationBell.css';

const NotificationBell = () => {
  const { getAuthHeaders } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
        console.log("NotificationBell raw response:", data);
        
        // 백엔드에서 직접 배열을 반환하므로 처리 방식 변경
        if (Array.isArray(data)) {
          setNotifications(data);
        } else if (data.success && data.data) {
          setNotifications(data.data);
        } else {
          setNotifications([]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // 읽지 않은 알림 개수 가져오기
  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications/unread-count', {
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        console.log("Unread count response:", data);
        
        // 백엔드에서 직접 숫자를 반환하므로 처리 방식 변경
        if (typeof data === 'number') {
          setUnreadCount(data);
        } else if (data.success && typeof data.data === 'number') {
          setUnreadCount(data.data);
        } else {
          setUnreadCount(0);
        }
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  // 알림 읽음 처리 및 이동
  const handleNotificationClick = async (notification) => {
    
    if (!notification.isRead) {
      try {
        const readResponse = await fetch(`/api/notifications/${notification.id}/read`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          credentials: 'include'
        });
        if (readResponse.ok) {
          
        } else {
          
        }
        // 읽음 처리 후 목록/카운트 갱신
        fetchNotifications();
        fetchUnreadCount();
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    }
    // 게시글로 이동 (알림에 postId, snippetId, commentId 등 포함되어야 함)
    if (notification.targetType === 'POST' && notification.targetId) {
      const path = `/board/${notification.targetId}`;
      
      navigate(path);
    } else if (notification.targetType === 'SNIPPET' && notification.targetId) {
      const path = `/snippets/${notification.targetId}`;
      
      navigate(path);
    } else if (notification.targetType === 'COMMENT' && notification.targetId && notification.parentId) {
      // 예시: 댓글 알림이면 해당 게시글/스니펫으로 이동
      const path = `/board/${notification.parentId}#comment-${notification.targetId}`;
      
      navigate(path);
    }
    // 필요시 다른 타입도 추가
  };

  // 모든 알림 읽음 처리
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      if (response.ok) {
        fetchNotifications();
        fetchUnreadCount();
      } else {
        console.error("Failed to mark all notifications as read: ", response.statusText);
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // 테스트용 알림 생성
  const createTestNotification = async () => {
    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      if (response.ok) {
        console.log("Test notification created successfully");
        fetchNotifications();
        fetchUnreadCount();
      } else {
        console.error("Failed to create test notification: ", response.statusText);
      }
    } catch (error) {
      console.error("Error creating test notification:", error);
    }
  };

  useEffect(() => {
    console.log('NotificationBell useEffect triggered');
    fetchNotifications();
    fetchUnreadCount();
    
    // 브라우저 알림 권한 요청
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    // WebSocket 연결 시도
    const userEmail = localStorage.getItem('userEmail');
    console.log('User email from localStorage:', userEmail);
    
    if (userEmail) {
      console.log('Attempting WebSocket connection for:', userEmail);
      try {
        webSocketService.connect(userEmail, (notification) => {
          console.log('WebSocket notification received:', notification);
          // 실시간 알림 수신 시 처리
          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // 브라우저 알림 표시 (선택사항)
          if (Notification.permission === 'granted') {
            new Notification('새로운 알림', {
              body: notification.message,
              icon: '/favicon.ico'
            });
          }
        });
      } catch (error) {
        console.error('WebSocket connection failed:', error);
      }
    } else {
      console.log('No user email found, skipping WebSocket connection');
    }
    
    // 폴링 간격을 늘려서 WebSocket이 주 역할을 하도록 함
    const interval = setInterval(fetchUnreadCount, 60000); // 1분으로 변경
    
    return () => {
      clearInterval(interval);
      webSocketService.disconnect();
    };
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
      <div className="app-bell-container" onClick={() => {
        console.log('Bell clicked, current showDropdown:', showDropdown);
        console.log('Current notifications:', notifications);
        console.log('Current unreadCount:', unreadCount);
        setShowDropdown(!showDropdown);
      }}>
        <FaBell className="app-bell-icon" />
        {unreadCount > 0 && (
          <span className="app-notification-badge">{unreadCount}</span>
        )}
        {/* WebSocket 연결 상태 표시 */}
        <div className={`websocket-status ${webSocketService.isConnected() ? 'connected' : 'disconnected'}`}>
          {webSocketService.isConnected() ? '🔗' : '🔌'}
        </div>
      </div>
      {showDropdown && (
        <div className="app-notification-dropdown">
          <div className="app-notification-header">
            <h3>알림 ({notifications.length}개)</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="app-mark-all-read-btn"
                onClick={createTestNotification}
                style={{ fontSize: '10px', padding: '2px 6px' }}
              >
                테스트 알림
              </button>
              {unreadCount > 0 && (
                <button 
                  className="app-mark-all-read-btn"
                  onClick={markAllAsRead}
                >
                  모두 읽음 처리
                </button>
              )}
            </div>
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