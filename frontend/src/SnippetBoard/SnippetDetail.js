// src/SnippetBoard/SnippetBoard.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function SnippetBoard() {
  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/v1/snippets?page=0&size=10')
      .then((res) => {
        if (!res.ok) throw new Error('스니펫 목록을 불러오는 데 실패했습니다.');
        return res.json();
      })
      .then((data) => {
        setSnippets(data.content || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('❌ 오류:', err);
        alert(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>로딩 중...</p>;

  return (
    <div className="snippet-board">
      <h2>💾 전체 스니펫 게시판</h2>
      {snippets.length === 0 ? (
        <p>등록된 스니펫이 없습니다.</p>
      ) : (
        <ul className="snippet-list">
          {snippets.map((snippet) => (
            <li
              key={snippet.snippetId}
              className="snippet-card"
              onClick={() => navigate(`/snippets/${snippet.snippetId}`)}
              style={{ cursor: 'pointer' }}
            >
              <h4>{snippet.title}</h4>
              <p>언어: {snippet.language}</p>
              <p>좋아요: {snippet.likeCount}</p>
              <small>{new Date(snippet.createdAt).toLocaleString()}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SnippetBoard;
