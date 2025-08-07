import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../css/AIProblemGeneration.css';

function AIProblemGeneration() {
  const { getAuthHeaders } = useAuth();
  const [formData, setFormData] = useState({
    difficulty: 'MEDIUM',
    category: 'ALGORITHM',
    description: '',
    additionalRequirements: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatedProblem, setGeneratedProblem] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateProblem = async () => {
    setLoading(true);
    setError(null);
    setGeneratedProblem(null);

    try {
      // 백엔드 API 호출 시도
      const params = new URLSearchParams();
      params.append('difficulty', formData.difficulty);
      params.append('category', formData.category);
      
      // 사용자가 입력한 설명이 있으면 추가
      if (formData.description && formData.description.trim()) {
        params.append('description', formData.description);
      }
      if (formData.additionalRequirements && formData.additionalRequirements.trim()) {
        params.append('additionalRequirements', formData.additionalRequirements);
      }

      const response = await fetch(`/api/ai/problems/generate?${params.toString()}`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setGeneratedProblem(data.data);
      } else {
        // 백엔드 API 실패 시 에러 메시지 표시
        const errorData = await response.json();
        setError(errorData.message || '문제 생성에 실패했습니다.');
      }
     } catch (err) {
       console.error('💥 AI 문제 생성 실패:', err);
       setError('문제 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const saveProblem = async () => {
    if (!generatedProblem) return;

    try {
      const response = await fetch('/api/problems', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(generatedProblem),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '문제 저장 중 오류가 발생했습니다.');
      }

      alert('문제가 성공적으로 저장되었습니다!');
      setGeneratedProblem(null);
      setFormData({
        difficulty: 'MEDIUM',
        category: 'ALGORITHM',
        description: '',
        additionalRequirements: ''
      });
    } catch (err) {
      alert(err.message);
      console.error('문제 저장 실패:', err);
    }
  };

  return (
    <div className="ai-problem-generation">
      <div className="container">
        <div className="page-header">
          <h1>🤖 AI 문제 생성</h1>
          <p>원하는 조건에 맞는 코딩 문제를 AI가 생성해드립니다.</p>
        </div>

        <div className="generation-form">
          <h3>📝 문제 생성 조건</h3>
          
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="difficulty">난이도</label>
              <select
                id="difficulty"
                name="difficulty"
                value={formData.difficulty}
                onChange={handleInputChange}
              >
                <option value="EASY">쉬움</option>
                <option value="MEDIUM">보통</option>
                <option value="HARD">어려움</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="category">카테고리</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
              >
                <option value="ALGORITHM">알고리즘</option>
                <option value="DATA_STRUCTURE">자료구조</option>
                <option value="MATHEMATICS">수학</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">문제 설명 (선택사항)</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="원하는 문제의 구체적인 내용이나 요구사항을 설명해주세요..."
              rows="4"
            />
          </div>

          <div className="form-group">
            <label htmlFor="additionalRequirements">추가 요구사항 (선택사항)</label>
            <textarea
              id="additionalRequirements"
              name="additionalRequirements"
              value={formData.additionalRequirements}
              onChange={handleInputChange}
              placeholder="시간복잡도, 특정 알고리즘 사용 등 추가 요구사항이 있다면 입력해주세요..."
              rows="3"
            />
          </div>

          <button 
            onClick={generateProblem} 
            disabled={loading}
            className="generate-btn"
          >
            {loading ? '문제 생성 중...' : '🚀 문제 생성하기'}
          </button>
        </div>

        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}

        {generatedProblem && (
          <div className="generated-problem">
            <div className="problem-header">
              <h3>🎯 생성된 문제</h3>
              <button onClick={saveProblem} className="save-btn">
                💾 문제 저장하기
              </button>
            </div>

            <div className="problem-content">
              <div className="problem-info">
                <div className="info-item">
                  <span className="info-label">제목:</span>
                  <span className="info-value">{generatedProblem.title}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">난이도:</span>
                  <span className={`info-value difficulty-${generatedProblem.difficulty.toLowerCase()}`}>
                    {generatedProblem.difficulty === 'EASY' ? '쉬움' : generatedProblem.difficulty === 'MEDIUM' ? '보통' : '어려움'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">카테고리:</span>
                  <span className="info-value">{generatedProblem.category === 'ALGORITHM' ? '알고리즘' : generatedProblem.category === 'DATA_STRUCTURE' ? '자료구조' : '수학'}</span>
                </div>
              </div>

              <div className="problem-section">
                <h4>📋 문제 설명</h4>
                <div className="section-content">
                  <p>{generatedProblem.description}</p>
                </div>
              </div>

              <div className="problem-section">
                <h4>📝 문제 문장</h4>
                <div className="section-content">
                  <pre className="code-block">{generatedProblem.problemStatement}</pre>
                </div>
              </div>

              <div className="problem-section">
                <h4>📥 입력 형식</h4>
                <div className="section-content">
                  <pre className="code-block">{generatedProblem.inputFormat}</pre>
                </div>
              </div>

              <div className="problem-section">
                <h4>📤 출력 형식</h4>
                <div className="section-content">
                  <pre className="code-block">{generatedProblem.outputFormat}</pre>
                </div>
              </div>

              <div className="problem-section">
                <h4>⚠️ 제약 조건</h4>
                <div className="section-content">
                  <pre className="code-block">{generatedProblem.constraints}</pre>
                </div>
              </div>

              <div className="problem-section">
                <h4>📋 예시 입력</h4>
                <div className="section-content">
                  <pre className="code-block">{generatedProblem.sampleInput}</pre>
                </div>
              </div>

              <div className="problem-section">
                <h4>📤 예시 출력</h4>
                <div className="section-content">
                  <pre className="code-block">{generatedProblem.sampleOutput}</pre>
                </div>
              </div>

              <div className="problem-section">
                <h4>💻 솔루션 템플릿</h4>
                <div className="section-content">
                  <pre className="code-block">{generatedProblem.solutionTemplate}</pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AIProblemGeneration; 