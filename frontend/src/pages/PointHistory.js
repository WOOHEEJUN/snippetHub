import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaCoins, FaPlus, FaMinus, FaCalendarAlt, FaInfoCircle, FaFilter, FaSearch, FaChartLine, FaTrophy, FaBell } from 'react-icons/fa';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPointType, setSelectedPointType] = useState('ALL');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    fetchPointHistory();
  }, [filter, selectedMonth]);

  const fetchPointHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('포인트 히스토리 조회 시작...');
      
      // 포인트 히스토리 API 호출
      const historyResponse = await fetch('/api/points/my/history', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      console.log('히스토리 응답 상태:', historyResponse.status);

      // 현재 포인트 정보 API 호출
      const pointsResponse = await fetch('/api/points/my', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      console.log('포인트 응답 상태:', pointsResponse.status);

      if (historyResponse.ok && pointsResponse.ok) {
        const historyData = await historyResponse.json();
        const pointsData = await pointsResponse.json();
        
        console.log('히스토리 데이터:', historyData);
        console.log('포인트 데이터:', pointsData);
        
        if (historyData.success && pointsData.success) {
          setPointHistory(historyData.data.content || []);
          setCurrentPoints(pointsData.data.currentPoints || 0);
          console.log('포인트 히스토리 개수:', historyData.data.content?.length || 0);
        } else {
          setError(`포인트 내역을 불러올 수 없습니다. 히스토리: ${historyData.message}, 포인트: ${pointsData.message}`);
        }
      } else {
        const historyText = await historyResponse.text();
        const pointsText = await pointsResponse.text();
        console.error('API 응답 실패:', { historyStatus: historyResponse.status, historyText, pointsStatus: pointsResponse.status, pointsText });
        setError(`API 호출 실패. 히스토리: ${historyResponse.status}, 포인트: ${pointsResponse.status}`);
      }
    } catch (err) {
      console.error('포인트 내역 조회 실패:', err);
      setError(`포인트 내역을 불러올 수 없습니다: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getPointTypeInfo = (type) => {
    return POINT_TYPES[type] || { label: type, icon: '💰', color: '#6c757d' };
  };

  const getPointTypeInfoFromDisplay = (displayName) => {
    // 백엔드에서 받은 displayName을 기반으로 아이콘과 색상 매핑
    const typeMap = {
      '게시글 작성': { label: '게시글 작성', icon: '📝', color: '#28a745' },
      '스니펫 작성': { label: '스니펫 작성', icon: '💻', color: '#007bff' },
      '댓글 작성': { label: '댓글 작성', icon: '💬', color: '#17a2b8' },
      '좋아요 받음': { label: '좋아요 받음', icon: '❤️', color: '#e74c3c' },
      '일일 로그인': { label: '일일 로그인', icon: '📅', color: '#ffc107' },
      '연속 로그인': { label: '연속 로그인', icon: '🔥', color: '#fd7e14' },
      '레벨업': { label: '레벨업', icon: '⭐', color: '#6f42c1' },
      '뱃지 획득': { label: '뱃지 획득', icon: '🏅', color: '#20c997' },
      '코드 실행': { label: '코드 실행', icon: '⚡', color: '#6c757d' },
      '문제 해결': { label: '문제 해결', icon: '🎯', color: '#dc3545' },
      'AI 평가': { label: 'AI 평가', icon: '🤖', color: '#6610f2' },
      'AI 문제 생성': { label: 'AI 문제 생성', icon: '🧠', color: '#fd7e14' }
    };
    
    return typeMap[displayName] || { label: displayName, icon: '💰', color: '#6c757d' };
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
          acc[item.pointTypeDisplay] = (acc[item.pointTypeDisplay] || 0) + 1;
          return acc;
        }, {})
      : {};
    
    const topType = Object.entries(mostFrequentType)
      .sort(([,a], [,b]) => b - a)[0];
    
    return {
      totalEarned,
      totalSpent,
      topType: topType ? topType[0] : '없음'
    };
  };

  // 필터링된 포인트 히스토리
  const getFilteredHistory = () => {
    let filtered = pointHistory;

    // 검색어 필터
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.pointTypeDisplay?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 포인트 타입 필터
    if (selectedPointType !== 'ALL') {
      filtered = filtered.filter(item => item.pointTypeDisplay === selectedPointType);
    }

    // 날짜 범위 필터
    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.createdAt);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        return itemDate >= startDate && itemDate <= endDate;
      });
    }

    return filtered;
  };

  const stats = calculateStats();
  const filteredHistory = getFilteredHistory();

  if (loading) return <div className="loading-message">포인트 내역을 불러오는 중...</div>;
  if (error) return <div className="error-message">오류: {error}</div>;

  return (
    <div className="point-history-page">
      <div className="container">
        <div className="page-header">
          <h1>💰 포인트 히스토리</h1>
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
            <div className="points-actions">
              <button 
                className={`btn ${showFilters ? 'btn-primary' : 'btn-outline-primary'}`} 
                onClick={() => setShowFilters(!showFilters)}
              >
                <FaFilter /> {showFilters ? '필터 숨기기' : '필터 보기'}
              </button>
              <Link to="/mypage/points-guide" className="btn btn-outline-info">
                <FaInfoCircle /> 가이드
              </Link>
            </div>
          </div>
        </div>

        {/* 고급 필터 섹션 */}
        {showFilters && (
          <div className="advanced-filter-section">
            <div className="filter-row">
              <div className="filter-group">
                <label>검색어:</label>
                <div className="search-input">
                  <FaSearch />
                  <input
                    type="text"
                    placeholder="설명이나 타입으로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="filter-group">
                <label>포인트 타입:</label>
                <select
                  value={selectedPointType}
                  onChange={(e) => setSelectedPointType(e.target.value)}
                  className="filter-select"
                >
                  <option value="ALL">전체 타입</option>
                  {Object.values(POINT_TYPES).map(type => (
                    <option key={type.label} value={type.label}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="filter-row">
              <div className="filter-group">
                <label>시작일:</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                  className="filter-input"
                />
              </div>
              
              <div className="filter-group">
                <label>종료일:</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                  className="filter-input"
                />
              </div>
              
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
            </div>
          </div>
        )}

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
                <FaTrophy />
              </div>
              <div className="stat-info">
                <div className="stat-label">가장 많이 획득한 활동</div>
                <div className="stat-value">{stats.topType}</div>
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="stat-item">
              <div className="stat-icon">
                <FaChartLine />
              </div>
              <div className="stat-info">
                <div className="stat-label">총 활동 수</div>
                <div className="stat-value">{pointHistory.length}회</div>
              </div>
            </div>
          </div>
        </div>

        {/* 포인트 내역 목록 */}
        <div className="history-section">
          <div className="history-header">
            <h3>📊 상세 내역</h3>
            <div className="history-summary">
              <span>총 {filteredHistory.length}건</span>
              {searchTerm && <span className="search-indicator">검색: "{searchTerm}"</span>}
            </div>
          </div>
          
          {filteredHistory.length === 0 ? (
            <div className="no-history">
              <FaCoins className="no-history-icon" />
              <p>포인트 히스토리가 없습니다.</p>
              <p className="no-history-subtitle">
                게시글 작성, 스니펫 작성, 댓글 작성 등의 활동을 하시면<br />
                포인트 히스토리가 생성됩니다.
              </p>
              <div className="no-history-actions">
                <Link to="/board/write" className="btn btn-primary">게시글 작성하기</Link>
                <Link to="/snippets/write" className="btn btn-primary">스니펫 작성하기</Link>
                <Link to="/problems" className="btn btn-primary">문제 풀기</Link>
              </div>
            </div>
          ) : (
            <div className="history-list">
              {filteredHistory.map((item, index) => {
                const typeInfo = getPointTypeInfoFromDisplay(item.pointTypeDisplay);
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