// src/components/NotificationBell.js
/* eslint-disable no-console */
import React, { useEffect, useState, useCallback } from 'react';
import { FaBell } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import '../css/NotificationBell.css';
import { useAuth } from '../context/AuthContext';
import webSocketService from '../services/WebSocketService';

const DEBUG = false;
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
    
    // 브라우저 알림 권한 요청
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    // WebSocket 연결 시도
    const userEmail = localStorage.getItem('userEmail');
    log('User email from localStorage:', userEmail);
    
    if (userEmail) {
      log('Attempting WebSocket connection for:', userEmail);
      try {
        webSocketService.connect(userEmail, (notification) => {
          log('WebSocket notification received:', notification);
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
      log('No user email found, skipping WebSocket connection');
    }
    
    // 폴링 간격을 늘려서 WebSocket이 주 역할을 하도록 함
    const id = setInterval(fetchUnreadCount, 60000); // 1분으로 변경
    return () => {
      clearInterval(id);
      webSocketService.disconnect();
    };
  }, [fetchNotifications, fetchUnreadCount, getAuthHeaders]);

  const handleNotificationClick = async (n) => {
    try {
      // 읽지 않은 알림이면 읽음 처리
      if (!(n.isRead ?? n.read)) {
        await markAsRead(n.id);
      }
      
             // 실제 게시글/스니펫 ID를 찾는 로직 개선
       let actualPostId = null;
       let actualSnippetId = null;
       
               // 1. targetId가 있으면 우선 사용
        if (n.targetId && n.targetType === 'POST') {
          actualPostId = n.targetId;
        } else if (n.targetId && n.targetType === 'SNIPPET') {
          actualSnippetId = n.targetId;
        }
        // 2. parentId가 있으면 사용 (댓글의 경우)
        else if (n.parentId && n.targetType === 'POST') {
          actualPostId = n.parentId;
        } else if (n.parentId && n.targetType === 'SNIPPET') {
          actualSnippetId = n.parentId;
        }
        // 3. 메시지에서 ID 추출
        else if (n.message) {
          const extractedIds = extractIdsFromMessage(n.message);
          if (extractedIds.length > 0) {
            // 메시지 내용으로 게시글인지 스니펫인지 판단
            if (n.message.includes('스니펫')) {
              actualSnippetId = extractedIds[0];
            } else {
              actualPostId = extractedIds[0];
            }
          }
        }
      
      
      
             // 알림 타입 결정 (여러 방법으로)
       const notificationType = n.notificationType || n.targetType || determineTypeFromMessage(n.message);
      
      let targetPath = null;
      
                                  // 게시글 관련 알림인 경우, 실제 존재하는 게시글인지 확인
       // 단, targetType이 SNIPPET이면 스니펫으로 처리
       if ((['POST', 'COMMENT', 'LIKE'].includes(notificationType?.toUpperCase()) && n.targetType !== 'SNIPPET') || 
           (n.message && (n.message.includes('게시글') || n.message.includes('댓글') || n.message.includes('좋아요')) && !n.message.includes('스니펫'))) {
          
                     if (actualPostId) {
             // 게시글 존재 여부 확인
             try {
               const response = await fetch(`/api/posts/${actualPostId}`, {
                 headers: getAuthHeaders(),
                 credentials: 'include'
               });
               
               if (response.ok) {
                 // 게시글이 존재하면 해당 게시글로 이동
                 targetPath = `/board/${actualPostId}`;
               } else {
                 // 게시글이 존재하지 않으면 게시글 목록으로 이동
                 targetPath = '/board';
                 alert('해당 게시글이 삭제되었거나 존재하지 않습니다. 게시글 목록으로 이동합니다.');
               }
             } catch (error) {
               console.error('Error checking post existence:', error);
               // 오류 발생 시 게시글 목록으로 이동
               targetPath = '/board';
             }
           } else {
             // ID가 없으면 게시글 목록으로 이동
             targetPath = '/board';
           }
        } 
               // 스니펫 관련 알림인 경우, 실제 존재하는 스니펫인지 확인
       else if (['SNIPPET'].includes(notificationType?.toUpperCase()) || 
                n.targetType === 'SNIPPET' ||
                (n.message && n.message.includes('스니펫'))) {
          
                     if (actualSnippetId) {
             // 스니펫 존재 여부 확인
             try {
               const response = await fetch(`/api/snippets/${actualSnippetId}`, {
                 headers: getAuthHeaders(),
                 credentials: 'include'
               });
               
               if (response.ok) {
                 // 스니펫이 존재하면 해당 스니펫으로 이동
                 targetPath = `/snippets/${actualSnippetId}`;
               } else {
                 // 스니펫이 존재하지 않으면 스니펫 목록으로 이동
                 targetPath = '/snippets';
                 alert('해당 스니펫이 삭제되었거나 존재하지 않습니다. 스니펫 목록으로 이동합니다.');
               }
             } catch (error) {
               console.error('Error checking snippet existence:', error);
               // 오류 발생 시 스니펫 목록으로 이동
               targetPath = '/snippets';
             }
           } else {
             // ID가 없으면 스니펫 목록으로 이동
             targetPath = '/snippets';
           }
        } else {
                 // 타입별 경로 결정
         switch (notificationType?.toUpperCase()) {
           case 'SNIPPET':
             // 스니펫 관련 알림
             if (actualPostId) {
               targetPath = `/snippets/${actualPostId}`;
             }
             break;
             
           case 'POINT_EARNED':
           case 'POINT':
             targetPath = '/point-history';
             break;
             
           case 'LEVEL_UP':
           case 'LEVEL':
             targetPath = '/mypage';
             break;
             
           case 'BADGE_EARNED':
           case 'BADGE':
             targetPath = '/mypage/badges';
             break;
             
           case 'NEW_PROBLEM':
           case 'AI_EVALUATION':
           case 'PROBLEM_SOLVE':
           case 'PROBLEM':
             if (actualPostId) {
               targetPath = `/problems/${actualPostId}`;
             } else {
               targetPath = '/problems';
             }
             break;
             
           case 'DAILY_LOGIN':
           case 'CONSECUTIVE_LOGIN':
             targetPath = '/';
             break;
             
           default:
             // 메시지 내용으로 타입 추정
             const message = n.message || '';
             if (message.includes('스니펫')) {
               if (actualPostId) {
                 targetPath = `/snippets/${actualPostId}`;
               }
             } else if (message.includes('포인트')) {
               targetPath = '/point-history';
             } else if (message.includes('레벨')) {
               targetPath = '/mypage';
             } else if (message.includes('뱃지')) {
               targetPath = '/mypage/badges';
             } else if (message.includes('문제')) {
               if (actualPostId) {
                 targetPath = `/problems/${actualPostId}`;
               } else {
                 targetPath = '/problems';
               }
             } else {
               // 기본적으로 메인 페이지로 이동
               targetPath = '/';
             }
             break;
         }
      }
      
             // 경로가 설정되었으면 이동
       if (targetPath) {
         navigate(targetPath);
       }
      
      // 드롭다운 닫기
      setShowDropdown(false);
      
    } catch (error) {
      console.error('Error handling notification click:', error);
      // 오류 발생 시 메인 페이지로 이동
      navigate('/');
    }
  };
  
  // 메시지에서 ID 추출하는 헬퍼 함수
  const extractIdsFromMessage = (message) => {
    const ids = [];
    
    // 1. 명시적인 패턴 먼저 시도 (게시글 #123, 스니펫 #456 등)
    const explicitPatterns = [
      /(?:게시글|스니펫|댓글|문제)\s*#?(\d+)/g,
    ];
    
    explicitPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(message)) !== null) {
        const id = parseInt(match[1]);
        if (!isNaN(id) && id > 0) {
          ids.push(id);
        }
      }
    });
    
    // 2. 명시적인 패턴이 없으면, 사용자 ID는 제외하고 다른 숫자 찾기
    if (ids.length === 0) {
      // 사용자 ID 패턴 제외 (님이, 님의 등)
      const userPattern = /(\d+)님이?/g;
      const userMatches = [];
      let match;
      while ((match = userPattern.exec(message)) !== null) {
        userMatches.push(parseInt(match[1]));
      }
      
      // 모든 숫자 찾기
      const allNumbers = message.match(/\d+/g) || [];
      const allIds = allNumbers.map(num => parseInt(num)).filter(id => !isNaN(id) && id > 0);
      
      // 사용자 ID를 제외한 숫자들만 선택
      const filteredIds = allIds.filter(id => !userMatches.includes(id));
      
      if (filteredIds.length > 0) {
        ids.push(...filteredIds);
      }
    }
    
    return [...new Set(ids)]; // 중복 제거
  };
  
  // 메시지에서 타입을 추정하는 헬퍼 함수
  const determineTypeFromMessage = (message) => {
    if (!message) return null;
    
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('게시글') || lowerMessage.includes('댓글') || lowerMessage.includes('좋아요')) {
      return 'POST';
    } else if (lowerMessage.includes('스니펫')) {
      return 'SNIPPET';
    } else if (lowerMessage.includes('포인트')) {
      return 'POINT_EARNED';
    } else if (lowerMessage.includes('레벨')) {
      return 'LEVEL_UP';
    } else if (lowerMessage.includes('뱃지')) {
      return 'BADGE_EARNED';
    } else if (lowerMessage.includes('문제')) {
      return 'PROBLEM';
    } else if (lowerMessage.includes('로그인')) {
      return 'DAILY_LOGIN';
    }
    
    return null;
  };

  return (
    <div className="app-notification-bell">

             <div className="app-bell-container" onClick={() => setShowDropdown(!showDropdown)}>
         <FaBell className="app-bell-icon" />
         {unreadCount > 0 && <span className="app-notification-badge">{unreadCount}</span>}
       </div>

             {showDropdown && (
         <div className="app-notification-dropdown">
           <div className="app-notification-header">
             <h3>알림 ({notifications.length}개)</h3>
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
                             notifications.map((n, index) => {
                 const isRead = n.isRead ?? n.read;
                 return (
                   <div
                     key={`${n.id}-${index}`}
                    className={`app-notification-item ${!isRead ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(n)}
                    style={{ 
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                                         onMouseEnter={(e) => {
                       e.currentTarget.style.backgroundColor = '#f0f0f0';
                       e.currentTarget.style.transform = 'translateX(1px)';
                     }}
                     onMouseLeave={(e) => {
                       e.currentTarget.style.backgroundColor = '';
                       e.currentTarget.style.transform = '';
                     }}
                  >
                    <div className="app-notification-content">
                      <p className="app-notification-message">{n.message}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                        <span className="app-notification-time">
                          {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                        </span>
                                                 <span style={{ 
                           fontSize: '10px', 
                           color: '#666', 
                           backgroundColor: '#e9ecef', 
                           padding: '2px 6px', 
                           borderRadius: '10px' 
                         }}>
                           {n.targetType || n.notificationType || '알림'}
                         </span>
                      </div>
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
