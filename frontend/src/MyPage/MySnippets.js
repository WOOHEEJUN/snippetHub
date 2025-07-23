import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../css/MyContentList.css';

function MySnippets() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = location.state?.accessToken || localStorage.getItem('accessToken');

  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      alert('토큰이 없습니다. 로그인하세요.');
      setLoading(false);
      return;
    }

    fetch(`/api/users/snippets?page=0&size=10&sort=createdAt,desc`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`스니펫 조회 실패: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        console.log('📦 스니펫 응답:', data);
        setSnippets(data.data.content || []); // ✅ 핵심 수정
      })
      .catch((err) => {
        console.error('❌ 스니펫 불러오기 오류:', err);
        alert(err.message || '스니펫 불러오기 실패');
        setSnippets([]);
      })
      .finally(() => setLoading(false));
  }, [token]);

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
