import React, { useState, useEffect } from 'react';
import { FaBell } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import webSocketService from '../services/WebSocketService';
import '../css/NotificationBell.css';

const NotificationBell = () => {
  const { getAuthHeaders } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [hideTimeout, setHideTimeout] = useState(null);
  const navigate = useNavigate();

  
  const unreadCount = notifications.filter(notification => !notification.read).length;

  
  const handleMouseEnter = () => {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      setHideTimeout(null);
    }
    setShowDropdown(true);
  };

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setShowDropdown(false);
    }, 200); 
    setHideTimeout(timeout);
  };

  
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

  
  const handleNotificationClick = async (notification) => {
    
    if (!notification.read) {
      try {
        const readResponse = await fetch(`/api/notifications/${notification.id}/read`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          credentials: 'include'
        });
        if (readResponse.ok) {
          
        } else {
          
        }
        
        fetchNotifications();
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    }
    
    if (notification.targetType === 'POST' && notification.targetId) {
      const path = `/board/${notification.targetId}`;
      
      navigate(path);
    } else if (notification.targetType === 'SNIPPET' && notification.targetId) {
      const path = `/snippets/${notification.targetId}`;
      
      navigate(path);
    } else if (notification.targetType === 'COMMENT' && notification.targetId && notification.parentId) {
      
      const path = `/board/${notification.parentId}#comment-${notification.targetId}`;
      
      navigate(path);
    }
    
  };

  
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      if (response.ok) {
        fetchNotifications();
      } else {
        console.error("Failed to mark all notifications as read: ", response.statusText);
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  useEffect(() => {
    console.log('NotificationBell useEffect triggered');
    
    
    fetchNotifications();
    
    
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    
    const userEmail = localStorage.getItem('userEmail');
    console.log('User email from localStorage:', userEmail);
    
    if (userEmail) {
      console.log('Attempting WebSocket connection for:', userEmail);
      try {
        webSocketService.connect(userEmail, (notification) => {
          console.log('WebSocket notification received:', notification);
          
          
          setNotifications(prev => {
            
            const isDuplicate = prev.some(existing => existing.id === notification.id);
            if (isDuplicate) {
              console.log('Duplicate notification detected, skipping:', notification.id);
              return prev;
            }
            
            
            const newNotifications = [notification, ...prev];
            if (newNotifications.length > 50) {
              return newNotifications.slice(0, 50);
            }
            return newNotifications;
          });
          
          
          if (Notification.permission === 'granted') {
            new Notification('새로운 알림', {
              body: notification.message,
              icon: '/favicon.ico'
            });
          }
        });
        
        
        setIsWebSocketConnected(true);
        console.log('WebSocket connected successfully');
      } catch (error) {
        console.error('WebSocket connection failed:', error);
        setIsWebSocketConnected(false);
      }
    } else {
      console.log('No user email found, skipping WebSocket connection');
      setIsWebSocketConnected(false);
    }
    
    return () => {
      webSocketService.disconnect();
      setIsWebSocketConnected(false);
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
    };
  }, []);

  
  useEffect(() => {
    let interval;
    
    if (!isWebSocketConnected) {
      
      interval = setInterval(() => {
        console.log('Polling for notifications (WebSocket not connected)');
        fetchNotifications();
      }, 60000); 
      console.log('WebSocket not connected, using polling fallback');
    } else {
      
      console.log('WebSocket connected, skipping polling completely');
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
        console.log('Polling interval cleared');
      }
    };
  }, [isWebSocketConnected]);

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
      <div 
        className="app-bell-container" 
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <FaBell className="app-bell-icon" />
        {unreadCount > 0 && (
          <span className="app-notification-badge">{unreadCount}</span>
        )}
      </div>
      {showDropdown && (
        <div 
          className="app-notification-dropdown"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="app-notification-header">
            <h3>알림 ({notifications.length}개)</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
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
                  className="app-notification-item"
                  data-read={notification.read}
                  onClick={() => handleNotificationClick(notification)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="app-notification-content">
                    <p className="app-notification-message">{notification.message}</p>
                    <span className="app-notification-time">
                      {formatDate(notification.createdAt)}
                    </span>
                  </div>
                  {!notification.read && <div className="app-unread-indicator" />}
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