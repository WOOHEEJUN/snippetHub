import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../css/MyContentList.css';

function MyPosts() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = location.state?.accessToken || localStorage.getItem('accessToken');

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      alert('토큰이 없습니다. 로그인하세요.');
      setLoading(false);
      return;
    }

    fetch(`/api/users/posts?page=0&size=10&sort=createdAt,desc`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`게시글 조회 실패: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        console.log('📦 게시글 응답:', data);
        setPosts(data.data.content || []); // ✅ 여기를 고침
      })
      .catch((err) => {
        console.error('❌ 게시글 불러오기 오류:', err);
        alert(err.message || '게시글 불러오기 실패');
        setPosts([]);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handlePostClick = (postId) => {
    navigate(`/board/${postId}`);
  };

  if (loading) return <p className="loading-message">로딩 중...</p>;

  return (
    <div className="my-content-container">
      <h2>내가 쓴 게시물</h2>
      {posts.length === 0 ? (
        <p className="empty-message">작성한 게시물이 없습니다.</p>
      ) : (
        <ul className="content-list">
          {posts.map((post) => (
            <li
              key={post.postId}
              className="content-item"
              onClick={() => handlePostClick(post.postId)}
            >
              <div className="item-title">{post.title}</div>
              <div className="item-details">
                <span className="date">{new Date(post.createdAt).toLocaleDateString()}</span>
                {post.likeCount !== undefined && (
                  <span className="likes">
                    <i className="bi bi-heart-fill"></i> {post.likeCount}
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

export default MyPosts;
