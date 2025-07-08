// src/MyPage/MySnippets.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function MySnippets() {
  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    fetch('/api/v1/users/me/snippets?page=0&size=10', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(async res => {
        console.log('📡 응답 상태 코드:', res.status);

        if (res.status === 401) throw new Error('인증 실패: 로그인 다시 시도해주세요.');
        if (res.status === 403) throw new Error('권한이 없습니다.');
        if (res.status === 500) {
          const errorText = await res.text();
          console.error('🔥 서버 내부 오류:', errorText);
          throw new Error('서버 오류가 발생했습니다.');
        }
        if (!res.ok) throw new Error('스니펫 조회 실패');

        return res.json();
      })
      .then(data => {
        console.log('✅ 스니펫 데이터:', data);
        setSnippets(data.content || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('❌ 오류:', err);
        alert(err.message || '알 수 없는 오류가 발생했습니다.');
        setLoading(false);
      });
  }, [navigate]);

  if (loading) return <p>로딩 중...</p>;

  return (
    <div className="mysnippets-container">
      <h2>💻 내가 작성한 스니펫</h2>
      {snippets.length === 0 ? (
        <p>작성한 스니펫이 없습니다.</p>
      ) : (
        <ul className="snippet-list">
          {snippets.map(snippet => (
            <li key={snippet.snippetId} className="snippet-item">
              <h4
                onClick={() => navigate(`/snippets/${snippet.snippetId}`)}
                style={{ cursor: 'pointer', color: '#007bff' }}
              >
                {snippet.title}
              </h4>
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
