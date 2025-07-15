import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function MyPosts() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = location.state?.token || localStorage.getItem('token');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      alert('토큰이 없습니다. 로그인하세요.');
      return;
    }

    fetch('/api/v1/posts/users/me/posts', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`게시글 조회 실패: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setPosts(data || []);
        setLoading(false);
      })
      .catch((err) => {
        alert(err.message || '게시글 불러오기 실패');
        setLoading(false);
      });
  }, [token]);

  const handlePostClick = (postId) => {
    navigate(`/board/${postId}`); // ✅ 자유게시판 상세 페이지로 이동
  };

  if (loading) return <p>로딩 중...</p>;

  return (
    <div className="myposts-container">
      <h2>📝 내가 쓴 게시물</h2>
      {posts.length === 0 ? (
        <p>작성한 게시물이 없습니다.</p>
      ) : (
        <ul className="post-list">
          {posts.map((post) => (
            <li
              key={post.postId}
              className="post-item"
              onClick={() => handlePostClick(post.postId)}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ fontWeight: 'bold', color: '#007bff' }}>
                {post.title}
              </div>
              <small>{new Date(post.createdAt).toLocaleString()}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default MyPosts;
