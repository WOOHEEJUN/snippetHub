// src/components/NotificationBell.js
/* eslint-disable no-console */
import React, { useEffect, useState, useCallback } from 'react';
import { FaBell } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import '../css/NotificationBell.css';
import { useAuth } from '../context/AuthContext';

const DEBUG = true;
const log = (...args) => DEBUG && console.log('[Bell]', ...args);

async function safeJson(res) {
  const text = await res.text();
  try { return text ? JSON.parse(text) : null; } catch { return null; }
}

// 응답 포맷이 바뀌어도 웬만하면 배열 뽑히게
function normalizeList(body) {
  if (!body) return [];
  if (Array.isArray(body)) return body;
  if (Array.isArray(body.data)) return body.data;
  if (Array.isArray(body.content)) return body.content;
  if (body.data?.content && Array.isArray(body.data.content)) return body.data.content;
  if (Array.isArray(body.items)) return body.items;
  return [];
}

// 숫자 포맷도 느슨하게 파싱
function parseUnreadCount(body) {
  if (!body) return 0;
  if (typeof body === 'number') return body;
  if (typeof body.data === 'number') return body.data;
  if (typeof body.count === 'number') return body.count;
  if (typeof body.unread === 'number') return body.unread;
  return 0;
}

const NotificationBell = () => {
  const { getAuthHeaders } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 네트워크 호출들
  const fetchUnreadCount = useCallback(async () => {
    const url = '/api/notifications/unread-count';
    const headers = (typeof getAuthHeaders === 'function' ? getAuthHeaders() : {}) || {};
    log('GET', url, { headers });
    try {
      const res = await fetch(url, { headers, credentials: 'include' });
      log('unread status:', res.status, res.statusText);
      const body = await safeJson(res);
      log('unread body:', body);
      if (!res.ok) {
        setUnreadCount(0);
        return;
      }
      setUnreadCount(parseUnreadCount(body));
    } catch (e) {
      console.error('[Bell] unread error:', e);
      setUnreadCount(0);
    }
  }, [getAuthHeaders]);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    const url = '/api/notifications';
    const headers = (typeof getAuthHeaders === 'function' ? getAuthHeaders() : {}) || {};
    log('GET', url, { headers });
    try {
      const res = await fetch(url, { headers, credentials: 'include' });
      log('list status:', res.status, res.statusText);
      const body = await safeJson(res);
      log('list body:', body);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setNotifications(normalizeList(body));
    } catch (e) {
      console.error('[Bell] list error:', e);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  const markAsRead = async (id) => {
    const url = `/api/notifications/${id}/read`;
    const headers = (typeof getAuthHeaders === 'function' ? getAuthHeaders() : {}) || {};
    console.log('POST', url, { headers });
    try {
      const res = await fetch(url, { method: 'POST', headers, credentials: 'include' });
      console.log('mark status:', res.status, res.statusText);
      const body = await safeJson(res);
      console.log('mark body:', body);
      if (!res.ok) throw new Error('읽음 처리 실패');
      setNotifications((prev) => prev.map(n => n.id === id ? { ...n, isRead: true, read: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e) {
      console.error('[Bell] mark error:', e);
      alert('읽음 처리 실패');
    }
  };

  const markAllAsRead = async () => {
    const url = '/api/notifications/read-all';
    const headers = (typeof getAuthHeaders === 'function' ? getAuthHeaders() : {}) || {};
    log('POST', url, { headers });
    try {
      const res = await fetch(url, { method: 'POST', headers, credentials: 'include' });
      log('markAll status:', res.status, res.statusText);
      const body = await safeJson(res);
      log('markAll body:', body);
      if (!res.ok) throw new Error('전체 읽음 처리 실패');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error('[Bell] markAll error:', e);
      alert('전체 읽음 처리 실패');
    }
  };

  useEffect(() => {
    log('mounted. headers preview:', typeof getAuthHeaders === 'function' ? getAuthHeaders() : getAuthHeaders);
    fetchNotifications();
    fetchUnreadCount();
    const id = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(id);
  }, [fetchNotifications, fetchUnreadCount, getAuthHeaders]);

  const handleNotificationClick = async (n) => {
    if (!(n.isRead ?? n.read)) await markAsRead(n.id);
    if (n.targetType === 'POST' && n.targetId) navigate(`/board/${n.targetId}`);
    if (n.targetType === 'SNIPPET' && n.targetId) navigate(`/snippets/${n.targetId}`);
    setShowDropdown(false);
  };

  return (
    <div className="app-notification-bell">
      {/* 화면에 보이는 디버그 미니 배너 */}
      <div style={{ position:'absolute', transform:'translateY(-120%)', fontSize:11, color:'#999' }}>
        DBG: {loading ? 'loading' : 'idle'} • unread={unreadCount} • items={notifications.length}
        <button
          style={{ marginLeft:8 }}
          onClick={() => { fetchNotifications(); fetchUnreadCount(); }}
          type="button"
        >
          Ping
        </button>
      </div>

      <div className="app-bell-container" onClick={() => setShowDropdown(!showDropdown)}>
        <FaBell className="app-bell-icon" />
        {unreadCount > 0 && <span className="app-notification-badge">{unreadCount}</span>}
      </div>

      {showDropdown && (
        <div className="app-notification-dropdown">
          <div className="app-notification-header">
            <h3>알림</h3>
            {unreadCount > 0 && (
              <button className="app-mark-all-read-btn" onClick={markAllAsRead} type="button">
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
              notifications.map((n) => {
                const isRead = n.isRead ?? n.read;
                return (
                  <div
                    key={n.id}
                    className={`app-notification-item ${!isRead ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(n)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="app-notification-content">
                      <p className="app-notification-message">{n.message}</p>
                      <span className="app-notification-time">
                        {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                      </span>
                    </div>
                    {!isRead && <div className="app-unread-indicator" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
