import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../css/ProblemDetail.css';

function ProblemDetail() {
  const { problemId } = useParams();
  const { getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  
  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('java');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProblem();
  }, [problemId]);

  const fetchProblem = async () => {
    try {
      const response = await fetch(`/api/problems/${problemId}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProblem(data.data);
          // 기본 코드 템플릿 설정
          if (data.data.solutionTemplate) {
            setCode(data.data.solutionTemplate);
          }
        } else {
          setError(data.message || '문제를 불러올 수 없습니다.');
        }
      } else {
        setError('문제를 불러올 수 없습니다.');
      }
    } catch (err) {
      console.error('문제 조회 실패:', err);
      setError('문제를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      setError('코드를 입력해주세요.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          problemId: parseInt(problemId),
          code: code,
          language: language
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setResult(data.data);
        } else {
          setError(data.message || '제출에 실패했습니다.');
        }
      } else {
        setError('제출에 실패했습니다.');
      }
    } catch (err) {
      console.error('코드 제출 실패:', err);
      setError('제출에 실패했습니다.');
    } finally {
      setSubmitting(false);
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACCEPTED': return '#28a745';
      case 'WRONG_ANSWER': return '#dc3545';
      case 'TIME_LIMIT': return '#ffc107';
      case 'MEMORY_LIMIT': return '#fd7e14';
      case 'RUNTIME_ERROR': return '#6f42c1';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'ACCEPTED': return '정답';
      case 'WRONG_ANSWER': return '오답';
      case 'TIME_LIMIT': return '시간 초과';
      case 'MEMORY_LIMIT': return '메모리 초과';
      case 'RUNTIME_ERROR': return '런타임 오류';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="problem-detail">
        <div className="container">
          <div className="loading">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (error && !problem) {
    return (
      <div className="problem-detail">
        <div className="container">
          <div className="alert alert-danger">
            {error}
          </div>
          <button 
            onClick={() => navigate('/problems')}
            className="btn btn-primary"
          >
            문제 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="problem-detail">
      <div className="container">
        <div className="row">
          {/* 문제 설명 섹션 */}
          <div className="col-md-6">
            <div className="problem-section">
              <div className="problem-header">
                <h1>{problem.title}</h1>
                <div className="problem-meta">
                  <span 
                    className="difficulty-badge"
                    style={{ backgroundColor: getDifficultyColor(problem.difficulty) }}
                  >
                    {getDifficultyText(problem.difficulty)}
                  </span>
                  <span className="category-badge">{problem.category}</span>
                </div>
              </div>

              <div className="problem-content">
                <h3>문제 설명</h3>
                <p>{problem.description}</p>

                <h3>문제 문장</h3>
                <div className="problem-statement">
                  <pre>{problem.problemStatement}</pre>
                </div>

                <h3>입력 형식</h3>
                <div className="input-format">
                  <pre>{problem.inputFormat}</pre>
                </div>

                <h3>출력 형식</h3>
                <div className="output-format">
                  <pre>{problem.outputFormat}</pre>
                </div>

                <h3>제약 조건</h3>
                <div className="constraints">
                  <pre>{problem.constraints}</pre>
                </div>

                <h3>샘플 입력</h3>
                <div className="sample-input">
                  <pre>{problem.sampleInput}</pre>
                </div>

                <h3>샘플 출력</h3>
                <div className="sample-output">
                  <pre>{problem.sampleOutput}</pre>
                </div>
              </div>
            </div>
          </div>

          {/* 코드 작성 섹션 */}
          <div className="col-md-6">
            <div className="code-section">
              <div className="code-header">
                <h3>코드 작성</h3>
                <div className="language-selector">
                  <select 
                    value={language} 
                    onChange={(e) => setLanguage(e.target.value)}
                    className="form-select"
                  >
                    <option value="java">Java</option>
                    <option value="python">Python</option>
                    <option value="cpp">C++</option>
                    <option value="javascript">JavaScript</option>
                  </select>
                </div>
              </div>

              <div className="code-editor">
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="여기에 코드를 작성하세요..."
                  className="form-control"
                  rows="20"
                />
              </div>

              <div className="code-actions">
                <button 
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? '제출 중...' : '제출하기'}
                </button>
                <button 
                  onClick={() => setCode(problem.solutionTemplate || '')}
                  className="btn btn-outline-secondary"
                >
                  템플릿 불러오기
                </button>
              </div>

              {/* 제출 결과 */}
              {result && (
                <div className="submission-result">
                  <h4>제출 결과</h4>
                  <div className="result-info">
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(result.status) }}
                    >
                      {getStatusText(result.status)}
                    </span>
                    <span className="execution-time">
                      실행 시간: {result.executionTime}ms
                    </span>
                    <span className="memory-used">
                      메모리: {result.memoryUsed}MB
                    </span>
                  </div>
                  
                  {result.output && (
                    <div className="output-section">
                      <h5>출력</h5>
                      <pre className="output-content">{result.output}</pre>
                    </div>
                  )}
                  
                  {result.errorMessage && (
                    <div className="error-section">
                      <h5>오류 메시지</h5>
                      <pre className="error-content">{result.errorMessage}</pre>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="alert alert-danger mt-3">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProblemDetail;
