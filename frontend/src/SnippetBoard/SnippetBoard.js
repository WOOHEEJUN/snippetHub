import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SnippetBoard.css';

const LANGUAGES = [
  { label: '전체', value: '' },
  { label: 'C', value: 'c' },
  { label: 'Python', value: 'python' },
  { label: 'HTML', value: 'html' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'Java', value: 'java' },
  { label: 'CSS', value: 'css' },
];

function SnippetBoard() {
  const [snippets, setSnippets] = useState([]);
  const [language, setLanguage] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/v1/snippets?page=0&size=10${language ? `&language=${language}` : ''}`)
      .then((res) => res.json())
      .then((data) => {
        setSnippets(data.content || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('에러:', err);
        setLoading(false);
      });
  }, [language]);

  return (
    <div className="snippet-board">
      <div className="board-header">
        <h2>📚 전체 스니펫 게시판</h2>
        <button
          className="write-button"
          onClick={() => navigate('/snippets/write')}
        >
          ✍️ 게시물 작성
        </button>
      </div>

      <div className="category-tabs">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.value}
            className={`category-btn ${language === lang.value ? 'active' : ''}`}
            onClick={() => setLanguage(lang.value)}
          >
            {lang.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p>불러오는 중...</p>
      ) : snippets.length === 0 ? (
        <p>해당 언어에 대한 스니펫이 없습니다.</p>
      ) : (
        <ul className="snippet-list">
          {snippets.map((snippet) => (
            <li
              key={snippet.snippetId}
              className="snippet-item"
              onClick={() => navigate(`/snippets/${snippet.snippetId}`)}
            >
              <h4>{snippet.title}</h4>
              <p>{snippet.language}</p>
              <small>{new Date(snippet.createdAt).toLocaleString()}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SnippetBoard;
