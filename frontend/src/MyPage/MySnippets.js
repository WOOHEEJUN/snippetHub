import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/MyContentList.css';

function MySnippets() {
  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    if (!token) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    fetch(`/api/users/snippets?page=0&size=10&sort=createdAt,desc`, {
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
        console.log('📦 받은 스니펫 응답:', data);
        const result = data.data;
        if (Array.isArray(result.content)) {
          setSnippets(result.content);
        } else {
          console.error('❌ content가 배열이 아님:', result);
          setSnippets([]);
        }
      })
      .catch((err) => {
        alert(err.message || '스니펫을 불러오는 중 오류가 발생했습니다.');
      })
      .finally(() => setLoading(false));
  }, [navigate, token]);

  const handleSnippetClick = (snippetId) => {
    navigate(`/snippets/${snippetId}`);
  };

  if (loading) return <p className="loading-message">로딩 중...</p>;

  return (
    <div className="my-content-container">
      <h2>내가 작성한 스니펫</h2>
      {snippets.length === 0 ? (
        <p className="empty-message">작성한 스니펫이 없습니다.</p>
      ) : (
        <ul className="content-list">
          {snippets.map((snippet) => (
            <li
              key={snippet.snippetId}
              className="content-item"
              onClick={() => handleSnippetClick(snippet.snippetId)}
            >
              <div className="item-title">{snippet.title}</div>
              <div className="item-details">
                <span className="language">{snippet.language}</span>
                <span className="likes">
                  <i className="bi bi-heart-fill"></i> {snippet.likeCount}
                </span>
                <span className="date">{new Date(snippet.createdAt).toLocaleDateString()}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default MySnippets;
