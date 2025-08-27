import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import '../css/DailyProblem.css';

function DailyProblem() {
  const { getAuthHeaders } = useAuth();
  const [todayProblem, setTodayProblem] = useState(null);
  const [thisWeekProblems, setThisWeekProblems] = useState([]);
  const [thisMonthProblems, setThisMonthProblems] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('today');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchTodayProblem();
    fetchStatistics();
  }, []);

  // 자동 생성 제거 - 사용자가 직접 버튼을 눌러야 함

  const fetchTodayProblem = async () => {
    try {
      
      const response = await fetch('/api/daily-problems/today', {
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
      });

      

      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          setTodayProblem(data.data);
        } else {
          setError(data.message || '오늘의 문제를 불러올 수 없습니다.');
        }
      } else {
        // HTML 응답인지 확인
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          setError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        } else {
          setError(`오늘의 문제를 불러올 수 없습니다. (${response.status})`);
        }
      }
    } catch (err) {
      
      setError(`오늘의 문제를 불러올 수 없습니다: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchThisWeekProblems = async () => {
    try {
      const response = await fetch('/api/daily-problems/this-week', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setThisWeekProblems(data.data);
        }
      }
    } catch (err) {
      
    }
  };

  const fetchThisMonthProblems = async () => {
    try {
      const response = await fetch('/api/daily-problems/this-month', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setThisMonthProblems(data.data);
        }
      }
    } catch (err) {
      
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/daily-problems/statistics', {
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStatistics(data.data);
        }
      } else {
        // HTML 응답인지 확인
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          
        }
      }
    } catch (err) {
      
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'week' && thisWeekProblems.length === 0) {
      fetchThisWeekProblems();
    } else if (tab === 'month' && thisMonthProblems.length === 0) {
      fetchThisMonthProblems();
    }
  };

  const generateTodayProblem = async () => {
    setGenerating(true);
    setError(null);
    
    try {
      // 1단계: AI로 문제 생성
      const generateResponse = await fetch('/api/ai/problems/generate-daily', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
      });

      if (!generateResponse.ok) {
        throw new Error('AI 문제 생성에 실패했습니다.');
      }

      const generateData = await generateResponse.json();
      
      
      
      if (!generateData.success) {
        throw new Error(generateData.message || 'AI 문제 생성에 실패했습니다.');
      }

      // 2단계: 생성된 문제를 오늘의 일일 문제로 설정
      // 한국 시간대로 현재 날짜 계산
      const now = new Date();
      const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
      const today = koreaTime.toISOString().split('T')[0]; // YYYY-MM-DD 형식
      
      const dailyResponse = await fetch(`/api/daily-problems?problemDate=${today}&problemId=${generateData.data.problemId}`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
      });

      const dailyData = await dailyResponse.json();
      
      
      
      // 일일 문제 설정이 실패해도 AI 문제는 생성되었으므로 성공으로 처리
      if (!dailyData.success) {
        
        // AI 문제 생성은 성공했으므로 오늘의 문제로 직접 설정
        setTodayProblem(generateData.data);
        return;
      }

      // 3단계: 오늘의 문제 다시 조회
      await fetchTodayProblem();
      
    } catch (err) {
      
      setError(err.message || '오늘의 문제 생성에 실패했습니다.');
    } finally {
      setGenerating(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'EASY': return '#28a745';
      case 'MEDIUM': return '#ffc107';
      case 'HARD': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getDifficultyText = (difficulty) => {
    switch (difficulty) {
      case 'EASY': return '쉬움';
      case 'MEDIUM': return '보통';
      case 'HARD': return '어려움';
      default: return difficulty;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  if (loading) {
    return (
      <div className="daily-problem">
        <div className="container">
          <div className="loading">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="daily-problem">
      <div className="container">
        <h1>일일 문제</h1>
        <p className="description">
          매일 새로운 코딩 문제에 도전해보세요!
        </p>

        <div className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'today' ? 'active' : ''}`}
            onClick={() => handleTabChange('today')}
          >
            오늘의 문제
          </button>
          <button 
            className={`tab-btn ${activeTab === 'week' ? 'active' : ''}`}
            onClick={() => handleTabChange('week')}
          >
            이번 주
          </button>
          <button 
            className={`tab-btn ${activeTab === 'month' ? 'active' : ''}`}
            onClick={() => handleTabChange('month')}
          >
            이번 달
          </button>
          <button 
            className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => handleTabChange('stats')}
          >
            통계
          </button>
        </div>

        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        <div className="tab-content">
          {activeTab === 'today' && (
            <div className="today-problem">
              {todayProblem ? (
                <div className="problem-card">
                  <div className="problem-header">
                    <h2>오늘의 문제</h2>
                    <span className="date">{formatDate(todayProblem.createdAt)}</span>
                  </div>
                  <div className="problem-info">
                    <span 
                      className="difficulty-badge"
                      style={{ backgroundColor: getDifficultyColor(todayProblem.difficulty) }}
                    >
                      {getDifficultyText(todayProblem.difficulty)}
                    </span>
                    <span className="category-badge">{todayProblem.category}</span>
                  </div>
                  <h3 className="problem-title">{todayProblem.title}</h3>
                  <p className="problem-description">{todayProblem.description}</p>
                  <div className="problem-actions">
                    <Link 
                      to={`/problems/${todayProblem.problemId}`}
                      className="btn btn-primary"
                    >
                      문제 풀기
                    </Link>

                  </div>
                </div>
              ) : (
                <div className="no-problem">
                  <div className="welcome-message">
                    <h3>🎯 오늘의 코딩 도전을 시작해보세요!</h3>
                    <p>AI가 당신을 위해 맞춤형 코딩 문제를 생성해드립니다.</p>
                    <p>매일 새로운 도전으로 코딩 실력을 향상시켜보세요!</p>
                  </div>
                  <div className="problem-actions">
                    <button 
                      onClick={generateTodayProblem}
                      className="btn btn-primary btn-lg"
                      disabled={generating}
                    >
                      {generating ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          AI가 문제를 생성하고 있습니다...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-magic me-2"></i>
                          오늘의 문제 생성하기
                        </>
                      )}
                    </button>
                    <Link to="/problems" className="btn btn-outline-primary ms-3">
                      <i className="fas fa-list me-2"></i>
                      전체 문제 목록
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'week' && (
            <div className="week-problems">
              <h2>이번 주 일일 문제</h2>
              {thisWeekProblems.length > 0 ? (
                <div className="problems-grid">
                  {thisWeekProblems.map((problem, index) => (
                    <div key={problem.problemId} className="problem-card-small">
                      <div className="problem-header-small">
                        <span className="day-label">Day {index + 1}</span>
                        <span 
                          className="difficulty-badge-small"
                          style={{ backgroundColor: getDifficultyColor(problem.difficulty) }}
                        >
                          {getDifficultyText(problem.difficulty)}
                        </span>
                      </div>
                      <h4 className="problem-title-small">{problem.title}</h4>
                      <p className="problem-description-small">
                        {problem.description.substring(0, 100)}...
                      </p>
                      <Link 
                        to={`/problems/${problem.problemId}`}
                        className="btn btn-sm btn-primary"
                      >
                        풀기
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="loading">이번 주 문제들을 불러오는 중...</div>
              )}
            </div>
          )}

          {activeTab === 'month' && (
            <div className="month-problems">
              <h2>이번 달 일일 문제</h2>
              {thisMonthProblems.length > 0 ? (
                <div className="problems-grid">
                  {thisMonthProblems.map((problem, index) => (
                    <div key={problem.problemId} className="problem-card-small">
                      <div className="problem-header-small">
                        <span className="day-label">{formatDate(problem.createdAt)}</span>
                        <span 
                          className="difficulty-badge-small"
                          style={{ backgroundColor: getDifficultyColor(problem.difficulty) }}
                        >
                          {getDifficultyText(problem.difficulty)}
                        </span>
                      </div>
                      <h4 className="problem-title-small">{problem.title}</h4>
                      <p className="problem-description-small">
                        {problem.description.substring(0, 100)}...
                      </p>
                      <Link 
                        to={`/problems/${problem.problemId}`}
                        className="btn btn-sm btn-primary"
                      >
                        풀기
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="loading">이번 달 문제들을 불러오는 중...</div>
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="statistics">
              <h2>일일 문제 통계</h2>
              {statistics ? (
                <div className="stats-grid">
                  <div className="stat-card">
                    <h3>총 문제 수</h3>
                    <div className="stat-value">{statistics.totalProblems || 0}</div>
                  </div>
                  <div className="stat-card">
                    <h3>이번 주 문제 수</h3>
                    <div className="stat-value">{statistics.thisWeekProblems || 0}</div>
                  </div>
                  <div className="stat-card">
                    <h3>이번 달 문제 수</h3>
                    <div className="stat-value">{statistics.thisMonthProblems || 0}</div>
                  </div>
                  <div className="stat-card">
                    <h3>평균 해결률</h3>
                    <div className="stat-value">
                      {statistics.averageSolveRate ? `${(statistics.averageSolveRate * 100).toFixed(1)}%` : 'N/A'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="loading">통계를 불러오는 중...</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DailyProblem;
