import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../css/AICodeEvaluation.css';

function AICodeEvaluation({ snippetId, code, language, onEvaluationComplete }) {
  const { getAuthHeaders } = useAuth();
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const evaluateCode = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 개발 모드에서도 실제 API 호출 시도 (임시 데이터는 백엔드에서 처리)
      
      const response = await fetch('/api/ai/evaluate-code', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          snippetId,
          code,
          language
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '코드 평가 중 오류가 발생했습니다.');
      }

      const data = await response.json();
      setEvaluation(data.data);
      
      if (onEvaluationComplete) {
        onEvaluationComplete(data.data);
      }
    } catch (err) {
      console.error('💥 AI 코드 평가 실패:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-code-evaluation">
      <div className="evaluation-header">
        <h4>🤖 AI 코드 평가</h4>
        <button 
          onClick={evaluateCode} 
          disabled={loading}
          className="evaluate-btn"
        >
          {loading ? '평가 중...' : '코드 평가하기'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      {evaluation && (
        <div className="evaluation-result">
          <div className="score-section">
            <h5>📊 평가 점수</h5>
            <div className="score-display">
              <div className="score-item">
                <span className="score-label">전체 점수:</span>
                <span className="score-value">{evaluation.overallScore}/100</span>
              </div>
              <div className="score-item">
                <span className="score-label">가독성:</span>
                <span className="score-value">{evaluation.readabilityScore}/100</span>
              </div>
              <div className="score-item">
                <span className="score-label">성능:</span>
                <span className="score-value">{evaluation.performanceScore}/100</span>
              </div>
              <div className="score-item">
                <span className="score-label">보안:</span>
                <span className="score-value">{evaluation.securityScore}/100</span>
              </div>
            </div>
          </div>

          <div className="feedback-section">
            <h5>💡 개선 제안</h5>
            <div className="feedback-list">
              {evaluation.suggestions && evaluation.suggestions.map((suggestion, index) => (
                <div key={index} className="feedback-item">
                  <div className="feedback-type">{suggestion.type}</div>
                  <div className="feedback-content">{suggestion.content}</div>
                </div>
              ))}
            </div>
          </div>

          {evaluation.improvedCode && (
            <div className="improved-code-section">
              <h5>✨ 개선된 코드</h5>
              <pre className="improved-code">
                <code>{evaluation.improvedCode}</code>
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AICodeEvaluation; 