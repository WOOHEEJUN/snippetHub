import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SnippetWrite.css';

const LANGUAGES = [
  { label: '선택하세요', value: '' },
  { label: 'C', value: 'c' },
  { label: 'Python', value: 'python' },
  { label: 'HTML', value: 'html' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'Java', value: 'java' },
  { label: 'CSS', value: 'css' },
];

function SnippetWrite() {
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    console.log('전송할 데이터:', { title, description, code, language });
    if (!token) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    if (!title || !language || !description || !code) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    try {
      const response = await fetch('/api/v1/snippets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          code,
          language
        }),
      });

      console.log('응답 상태코드:', response.status);
      const responseData = await response.json().catch(() => null);
      console.log('응답 내용:', responseData);

      if (!response.ok) {
        const errorMsg = responseData?.message || '스니펫 게시물 등록에 실패했습니다.';
        throw new Error(errorMsg);
      }

      alert('게시물이 등록되었습니다!');
      navigate('/snippets');
    } catch (error) {
      console.error('에러 발생:', error);
      alert(error.message);
    }
  };

  return (
    <div className="snippet-write-container">
      <h2>✍️ 스니펫 게시물 작성</h2>
      <form onSubmit={handleSubmit} className="snippet-form">
        <label>
          제목:
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>

        <label>
          언어 선택:
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            required
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          설명:
          <textarea
            rows="4"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="이 스니펫에 대한 설명을 작성하세요."
            required
          />
        </label>

        <label>
          코드:
          <textarea
            rows="10"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="코드를 여기에 입력하세요."
            required
          />
        </label>

        <button type="submit" className="submit-btn">등록하기</button>
      </form>
    </div>
  );
}

export default SnippetWrite;
