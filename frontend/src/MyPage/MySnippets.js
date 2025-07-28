import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/MyContentList.css'; // 공통 CSS 임포트

function MySnippets() {
  const navigate = useNavigate();
  const token = localStorage.getItem('accessToken');
  const currentUserId = localStorage.getItem('userId');
  const parsedCurrentUserId = parseInt(currentUserId);
  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || isNaN(parsedCurrentUserId)) {
      setLoading(false);
      return;
    }

    fetch('/api/users/snippets?page=0&size=10&sort=createdAt,desc', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`스니펫 조회 실패: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const content = data?.data?.content;
        if (Array.isArray(content)) {
          const mySnippets = content.filter(snippet => snippet.author && snippet.author.userId === parsedCurrentUserId);
          setSnippets(mySnippets);
        } else {
          console.error('예상치 못한 데이터 구조:', data);
          setSnippets([]);
        }
      })
      .catch((err) => {
        alert(err.message || '스니펫 불러오기 실패');
      })
      .finally(() => setLoading(false));
  }, [token, parsedCurrentUserId]);

  const handleSnippetClick = (snippetId) => {
    navigate(`/snippets/${snippetId}`);
  };

  if (loading) return <p className="loading-message">로딩 중...</p>;

  return (
    <div className="my-content-container">
      <h2>내가 쓴 스니펫</h2>
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
                <span className="date">{new Date(snippet.createdAt).toLocaleDateString()}</span>
                {snippet.likeCount !== undefined && (
                  <span className="likes">
                    <i className="bi bi-heart-fill"></i> {snippet.likeCount}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default MySnippets;
