import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaCoins, FaPlus, FaMinus, FaCalendarAlt, FaInfoCircle } from 'react-icons/fa';
import '../css/PointHistory.css';

const POINT_TYPES = {
  POST_CREATE: { label: '게시글 작성', icon: '📝', color: '#28a745' },
  SNIPPET_CREATE: { label: '스니펫 작성', icon: '💻', color: '#007bff' },
  COMMENT_CREATE: { label: '댓글 작성', icon: '💬', color: '#17a2b8' },
  LIKE_RECEIVE: { label: '좋아요 받음', icon: '❤️', color: '#e74c3c' },
  DAILY_LOGIN: { label: '일일 로그인', icon: '📅', color: '#ffc107' },
  CONSECUTIVE_LOGIN: { label: '연속 로그인', icon: '🔥', color: '#fd7e14' },
  LEVEL_UP: { label: '레벨업', icon: '⭐', color: '#6f42c1' },
  BADGE_EARN: { label: '뱃지 획득', icon: '🏅', color: '#20c997' },
  CODE_EXECUTION: { label: '코드 실행', icon: '⚡', color: '#6c757d' },
  PROBLEM_SOLVE: { label: '문제 해결', icon: '🎯', color: '#dc3545' },
  AI_EVALUATION: { label: 'AI 평가', icon: '🤖', color: '#6610f2' },
  AI_PROBLEM_GENERATE: { label: 'AI 문제 생성', icon: '🧠', color: '#fd7e14' }
};

function PointHistory() {
  const { getAuthHeaders } = useAuth();
  const [pointHistory, setPointHistory] = useState([]);
  const [currentPoints, setCurrentPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('ALL'); // ALL, EARN, SPEND
  const [selectedMonth, setSelectedMonth] = useState('ALL');

  useEffect(() => {
    fetchPointHistory();
  }, [filter, selectedMonth]);

  const fetchPointHistory = async () => {
    try {
      setLoading(true);
      
      // 백엔드 API 호출
      const response = await fetch('/api/points/my', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPointHistory(data.data.history || []);
          setCurrentPoints(data.data.currentPoints || 0);
        } else {
          setError(data.message || '포인트 내역을 불러올 수 없습니다.');
        }
      } else {
        setError('포인트 내역을 불러올 수 없습니다.');
      }
    } catch (err) {
      console.error('포인트 내역 조회 실패:', err);
      setError('포인트 내역을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getPointTypeInfo = (type) => {
    return POINT_TYPES[type] || { label: type, icon: '💰', color: '#6c757d' };
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMonthOptions = () => {
    const months = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
      months.push({ value, label });
    }
    
    return months;
  };

  const calculateStats = () => {
    const totalEarned = pointHistory
      .filter(item => item.pointChange > 0)
      .reduce((sum, item) => sum + item.pointChange, 0);
    
    const totalSpent = pointHistory
      .filter(item => item.pointChange < 0)
      .reduce((sum, item) => sum + Math.abs(item.pointChange), 0);
    
    const mostFrequentType = pointHistory.length > 0 
      ? pointHistory.reduce((acc, item) => {
          acc[item.type] = (acc[item.type] || 0) + 1;
          return acc;
        }, {})
      : {};
    
    const topType = Object.entries(mostFrequentType)
      .sort(([,a], [,b]) => b - a)[0];
    
    return {
      totalEarned,
      totalSpent,
      topType: topType ? getPointTypeInfo(topType[0]).label : '없음'
    };
  };

  const stats = calculateStats();

  if (loading) return <div className="loading-message">포인트 내역을 불러오는 중...</div>;
  if (error) return <div className="error-message">오류: {error}</div>;

  return (
    <div className="point-history-page">
      <div className="container">
        <div className="page-header">
          <h1>💰 포인트 내역</h1>
          <p>포인트 획득 및 사용 내역을 확인해보세요!</p>
          
        </div>

        {/* 현재 포인트 표시 */}
        <div className="current-points-section">
          <div className="current-points-card">
            <div className="points-icon">
              <FaCoins />
            </div>
            <div className="points-info">
              <div className="points-label">현재 포인트</div>
              <div className="points-value">{currentPoints.toLocaleString()} P</div>

            </div>
          </div>
        </div>

        {/* 통계 섹션 */}
        <div className="stats-section">
          <div className="stats-card">
            <div className="stat-item">
              <div className="stat-icon earn">
                <FaPlus />
              </div>
              <div className="stat-info">
                <div className="stat-label">총 획득</div>
                <div className="stat-value">{stats.totalEarned.toLocaleString()} P</div>
              </div>
            </div>
          </div>
          
          <div className="stats-card">
            <div className="stat-item">
              <div className="stat-icon spend">
                <FaMinus />
              </div>
              <div className="stat-info">
                <div className="stat-label">총 사용</div>
                <div className="stat-value">{stats.totalSpent.toLocaleString()} P</div>
              </div>
            </div>
          </div>
          
          <div className="stats-card">
            <div className="stat-item">
              <div className="stat-icon">
                <FaInfoCircle />
              </div>
              <div className="stat-info">
                <div className="stat-label">가장 많이 획득한 활동</div>
                <div className="stat-value">{stats.topType}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 필터 섹션 */}
        <div className="filter-section">
          <div className="filter-group">
            <label>유형:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">전체</option>
              <option value="EARN">획득</option>
              <option value="SPEND">사용</option>
            </select>
          </div>

          <div className="filter-group">
            <label>월:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">전체</option>
              {getMonthOptions().map(month => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 포인트 내역 목록 */}
        <div className="history-section">
          <h3>📊 상세 내역</h3>
          
          {pointHistory.length === 0 ? (
            <div className="no-history">
              <FaCoins className="no-history-icon" />
              <p>포인트 내역이 없습니다.</p>
            </div>
          ) : (
            <div className="history-list">
              {pointHistory.map((item, index) => {
                const typeInfo = getPointTypeInfo(item.type);
                const isEarned = item.pointChange > 0;
                
                return (
                  <div key={index} className={`history-item ${isEarned ? 'earned' : 'spent'}`}>
                    <div className="history-icon">
                      <span style={{ fontSize: '1.5rem' }}>{typeInfo.icon}</span>
                    </div>
                    
                    <div className="history-content">
                      <div className="history-title">
                        {typeInfo.label}
                      </div>
                      <div className="history-description">
                        {item.description || '포인트 변동'}
                      </div>
                      <div className="history-date">
                        <FaCalendarAlt />
                        {formatDate(item.createdAt)}
                      </div>
                    </div>
                    
                    <div className={`history-points ${isEarned ? 'earned' : 'spent'}`}>
                      {isEarned ? '+' : ''}{item.pointChange.toLocaleString()} P
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 포인트 획득 가이드 링크 */}
        <div className="guide-link-section">
          <Link to="/mypage/points-guide" className="guide-link">
            <FaInfoCircle />
            포인트 획득 방법 보기
          </Link>
        </div>
      </div>
    </div>
  );
}

export default PointHistory; 