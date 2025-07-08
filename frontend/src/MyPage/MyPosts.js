// src/MyPage/MyPosts.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function MyPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    fetch('/api/v1/users/me/posts?page=0&size=10', {
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
        if (!res.ok) throw new Error('게시글 조회 실패');

        return res.json();
      })
      .then(data => {
        console.log('✅ 게시글 데이터:', data);
        setPosts(data.content || []);
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
    <div className="myposts-container">
      <h2>📝 내가 쓴 게시물</h2>
      {posts.length === 0 ? (
        <p>작성한 게시물이 없습니다.</p>
      ) : (
        <ul className="post-list">
          {posts.map(post => (
            <li key={post.postId} className="post-item">
              <h4
                onClick={() => navigate(`/board/${post.postId}`)}
                style={{ cursor: 'pointer', color: '#007bff' }}
              >
                {post.title}
              </h4>
              <small>{new Date(post.createdAt).toLocaleString()}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default MyPosts;
