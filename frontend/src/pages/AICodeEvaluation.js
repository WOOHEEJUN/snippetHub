import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../css/AICodeEvaluation.css';

function AICodeEvaluation() {
  const { getAuthHeaders } = useAuth();
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('java');
  const [problemId, setProblemId] = useState('');
  const [evaluationType, setEvaluationType] = useState('quality');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const languages = [
    { value: 'java', label: 'Java' },
    { value: 'python', label: 'Python' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'cpp', label: 'C++' },
    { value: 'c', label: 'C' }
  ];

  const evaluationTypes = [
    { value: 'quality', label: '코드 품질 평가' },
    { value: 'optimization', label: '코드 최적화 제안' },
    { value: 'explanation', label: '코드 설명 생성' }
  ];

  const handleEvaluate = async () => {
    if (!code.trim()) {
      setError('코드를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let endpoint = '';
      let requestBody = {};

      switch (evaluationType) {
        case 'quality':
          endpoint = `/api/ai/evaluate/code-quality`;
          requestBody = {
            code: code,
            language: language,
            problemId: problemId || 1
          };
          break;
        case 'optimization':
          endpoint = `/api/ai/suggest/optimization`;
          requestBody = {
            code: code,
            language: language,
            problemId: problemId || 1
          };
          break;
        case 'explanation':
          endpoint = `/api/ai/explain/code`;
          requestBody = {
            code: code,
            language: language
          };
          break;
        default:
          throw new Error('지원하지 않는 평가 유형입니다.');
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data.data);
      } else {
        const errorData = await response.json();
        setError(errorData.message || '평가 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error('AI 코드 평가 실패:', err);
      setError('평가 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const renderResult = () => {
    if (!result) return null;

    switch (evaluationType) {
      case 'quality':
        return (
          <div className="evaluation-result">
            <h3>코드 품질 평가 결과</h3>
            <div className="score-section">
              <div className="score-item">
                <span>전체 점수:</span>
                <span className="score">{result.score ? Math.round(result.score * 10) : 'N/A'}/100</span>
              </div>
            </div>
            {result.feedback && (
              <div className="feedback">
                <h4>평가 피드백</h4>
                <p>{result.feedback}</p>
              </div>
            )}
            {result.improvements && result.improvements.length > 0 && (
              <div className="suggestions">
                <h4>개선 제안</h4>
                <ul>
                  {result.improvements.map((improvement, index) => (
                    <li key={index}>{improvement}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      case 'optimization':
        return (
          <div className="evaluation-result">
            <h3>코드 최적화 제안</h3>
            {result.explanation && (
              <div className="explanation">
                <h4>최적화 설명</h4>
                <p>{result.explanation}</p>
              </div>
            )}
            {result.suggestions && result.suggestions.length > 0 && (
              <div className="suggestions">
                <h4>최적화 제안</h4>
                <ul>
                  {result.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
            {result.optimizedCode && (
              <div className="improved-code">
                <h4>개선된 코드</h4>
                <pre><code>{result.optimizedCode}</code></pre>
              </div>
            )}
          </div>
        );

      case 'explanation':
        return (
          <div className="evaluation-result">
            <h3>코드 설명</h3>
            <div className="explanation">
              <p>{result}</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="ai-code-evaluation">
      <div className="container">
        <p className="description">
          AI가 코드의 품질을 평가하고, 최적화 방안을 제안하며, 코드에 대한 설명을 생성해드립니다.
        </p>

        <div className="evaluation-form">
          <div className="form-group">
            <label>평가 유형:</label>
            <select 
              value={evaluationType} 
              onChange={(e) => setEvaluationType(e.target.value)}
              className="form-control"
            >
              {evaluationTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>프로그래밍 언어:</label>
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              className="form-control"
            >
              {languages.map(lang => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          {evaluationType !== 'explanation' && (
            <div className="form-group">
              <label>문제 ID (선택사항):</label>
              <input
                type="number"
                value={problemId}
                onChange={(e) => setProblemId(e.target.value)}
                placeholder="문제 ID를 입력하세요"
                className="form-control"
              />
            </div>
          )}

          <div className="form-group">
            <label>코드:</label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="평가할 코드를 입력하세요..."
              className="form-control code-textarea"
              rows="15"
            />
          </div>

          <button 
            onClick={handleEvaluate} 
            disabled={loading || !code.trim()}
            className="btn btn-primary evaluate-btn"
          >
            {loading ? '평가 중...' : '코드 평가하기'}
          </button>
        </div>

        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        {renderResult()}
      </div>
    </div>
  );
}

export default AICodeEvaluation;
