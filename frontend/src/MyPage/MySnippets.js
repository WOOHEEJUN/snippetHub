// src/MyPage/MySnippets.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function MySnippets() {
  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    fetch('/api/v1/snippets/users/me/snippets', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorText = await res.text();
          console.error('❌ 오류 응답:', errorText);
          throw new Error(`스니펫 조회 실패: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setSnippets(data || []);
        setLoading(false);
      })
      .catch((err) => {
        alert(err.message || '스니펫을 불러오는 중 오류가 발생했습니다.');
        setLoading(false);
      });
  }, [navigate, token]);

  const handleSnippetClick = (snippetId) => {
    navigate(`/snippets/${snippetId}`); // ✅ 수정된 경로
  };

  if (loading) return <p>로딩 중...</p>;

  return (
    <div className="mysnippets-container">
      <h2>💻 내가 작성한 스니펫</h2>
      {snippets.length === 0 ? (
        <p>작성한 스니펫이 없습니다.</p>
      ) : (
        <ul className="snippet-list">
          {snippets.map((snippet) => (
            <li
              key={snippet.snippetId}
              className="snippet-item"
              onClick={() => handleSnippetClick(snippet.snippetId)}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ fontWeight: 'bold', color: '#007bff' }}>
                {snippet.title}
              </div>
              <p><strong>언어:</strong> {snippet.language}</p>
              <p><strong>좋아요:</strong> {snippet.likeCount}</p>
              <small>{new Date(snippet.createdAt).toLocaleString()}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default MySnippets;
