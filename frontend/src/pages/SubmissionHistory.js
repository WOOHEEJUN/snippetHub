import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import '../css/SubmissionHistory.css';

function SubmissionHistory() {
  const { getAuthHeaders } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedProblemId, setSelectedProblemId] = useState('');
  const [problemList, setProblemList] = useState([]);
  const [todayCount, setTodayCount] = useState(0);

  useEffect(() => {
    fetchProblemList();
    fetchTodayCount();
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [activeTab, currentPage, selectedProblemId]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      
      switch (activeTab) {
        case 'all':
          endpoint = `/api/submissions/my?page=${currentPage}&size=10`;
          break;
        case 'correct':
          endpoint = `/api/submissions/my/correct?page=${currentPage}&size=10`;
          break;
        case 'problem':
          if (selectedProblemId) {
            endpoint = `/api/submissions/my/problems/${selectedProblemId}?page=${currentPage}&size=10`;
          } else {
            setSubmissions([]);
            setLoading(false);
            return;
          }
          break;
        default:
          endpoint = `/api/submissions/my?page=${currentPage}&size=10`;
      }

      const response = await fetch(endpoint, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSubmissions(data.data.content || data.data);
          setTotalPages(data.data.totalPages || 0);
        } else {
          setError(data.message || '제출 이력을 불러올 수 없습니다.');
        }
      } else {
        setError('제출 이력을 불러올 수 없습니다.');
      }
    } catch (err) {
      console.error('제출 이력 조회 실패:', err);
      setError('제출 이력을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProblemList = async () => {
    try {
      const response = await fetch('/api/problems?size=100', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProblemList(data.data.content || []);
        }
      }
    } catch (err) {
      console.error('문제 목록 조회 실패:', err);
    }
  };

  const fetchTodayCount = async () => {
    try {
      const response = await fetch('/api/submissions/my/today-count', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTodayCount(data.data);
        }
      }
    } catch (err) {
      console.error('오늘 제출 횟수 조회 실패:', err);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(0);
    if (tab !== 'problem') {
      setSelectedProblemId('');
    }
  };

  const handleProblemChange = (problemId) => {
    setSelectedProblemId(problemId);
    setCurrentPage(0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CORRECT':
        return '#28a745';
      case 'WRONG_ANSWER':
        return '#dc3545';
      case 'TIME_LIMIT_EXCEEDED':
        return '#ffc107';
      case 'MEMORY_LIMIT_EXCEEDED':
        return '#fd7e14';
      case 'COMPILE_ERROR':
        return '#6f42c1';
      case 'RUNTIME_ERROR':
        return '#e83e8c';
      default:
        return '#6c757d';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'CORRECT':
        return '정답';
      case 'WRONG_ANSWER':
        return '오답';
      case 'TIME_LIMIT_EXCEEDED':
        return '시간 초과';
      case 'MEMORY_LIMIT_EXCEEDED':
        return '메모리 초과';
      case 'COMPILE_ERROR':
        return '컴파일 오류';
      case 'RUNTIME_ERROR':
        return '런타임 오류';
      default:
        return status;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR');
  };

  const formatExecutionTime = (timeMs) => {
    if (timeMs < 1000) {
      return `${timeMs}ms`;
    }
    return `${(timeMs / 1000).toFixed(2)}s`;
  };

  const formatMemoryUsage = (memoryKb) => {
    if (memoryKb < 1024) {
      return `${memoryKb}KB`;
    }
    return `${(memoryKb / 1024).toFixed(2)}MB`;
  };

  if (loading && submissions.length === 0) {
    return (
      <div className="submission-history">
        <div className="container">
          <div className="loading">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="submission-history">
      <div className="container">
        <h1>제출 이력</h1>
        <p className="description">
          내가 제출한 코드들의 이력을 확인할 수 있습니다.
        </p>

        <div className="stats-summary">
          <div className="stat-item">
            <span className="stat-label">오늘 제출</span>
            <span className="stat-value">{todayCount}회</span>
          </div>
        </div>

        <div className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => handleTabChange('all')}
          >
            전체 제출
          </button>
          <button 
            className={`tab-btn ${activeTab === 'correct' ? 'active' : ''}`}
            onClick={() => handleTabChange('correct')}
          >
            정답만
          </button>
          <button 
            className={`tab-btn ${activeTab === 'problem' ? 'active' : ''}`}
            onClick={() => handleTabChange('problem')}
          >
            특정 문제
          </button>
        </div>

        {activeTab === 'problem' && (
          <div className="problem-selector">
            <label>문제 선택:</label>
            <select 
              value={selectedProblemId} 
              onChange={(e) => handleProblemChange(e.target.value)}
              className="form-control"
            >
              <option value="">문제를 선택하세요</option>
              {problemList.map(problem => (
                <option key={problem.id} value={problem.id}>
                  {problem.title} ({problem.difficulty})
                </option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        <div className="submissions-container">
          {submissions.length > 0 ? (
            <>
              <div className="submissions-list">
                {submissions.map((submission, index) => (
                  <div key={submission.id} className="submission-card">
                    <div className="submission-header">
                      <div className="submission-info">
                        <h3 className="problem-title">
                          <Link to={`/problems/${submission.problemId}`}>
                            {submission.problemTitle}
                          </Link>
                        </h3>
                        <span className="submission-date">
                          {formatDate(submission.submittedAt)}
                        </span>
                      </div>
                      <div className="submission-status">
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(submission.status) }}
                        >
                          {getStatusText(submission.status)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="submission-details">
                      <div className="detail-item">
                        <span className="detail-label">언어:</span>
                        <span className="detail-value">{submission.language}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">실행 시간:</span>
                        <span className="detail-value">
                          {submission.executionTime ? formatExecutionTime(submission.executionTime) : 'N/A'}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">메모리 사용량:</span>
                        <span className="detail-value">
                          {submission.memoryUsage ? formatMemoryUsage(submission.memoryUsage) : 'N/A'}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">코드 길이:</span>
                        <span className="detail-value">{submission.codeLength || 0}자</span>
                      </div>
                    </div>

                    {submission.errorMessage && (
                      <div className="error-message">
                        <strong>오류 메시지:</strong>
                        <pre>{submission.errorMessage}</pre>
                      </div>
                    )}

                    <div className="submission-actions">
                      <button 
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => {
                          console.log('코드 보기:', submission.id);
                        }}
                      >
                      >
                        코드 보기
                      </button>
                      <Link 
                        to={`/problems/${submission.problemId}`}
                        className="btn btn-sm btn-primary"
                      >
                        다시 풀기
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button 
                    className="btn btn-outline-primary"
                    disabled={currentPage === 0}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    이전
                  </button>
                  <span className="page-info">
                    {currentPage + 1} / {totalPages}
                  </span>
                  <button 
                    className="btn btn-outline-primary"
                    disabled={currentPage >= totalPages - 1}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    다음
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="no-submissions">
              <p>제출 이력이 없습니다.</p>
              <Link to="/problems" className="btn btn-primary">
                문제 풀러 가기
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SubmissionHistory;
