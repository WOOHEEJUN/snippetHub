// ✅ src/Board/BoardDetail.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../css/Board.css';

function BoardDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/v1/posts/${postId}`)
      .then((res) => {
        if (!res.ok) throw new Error('응답 실패: ' + res.status);
        return res.json();
      })
      .then((data) => {
        console.log('📌 게시글 상세:', data);
        setPost(data);
      })
      .catch((err) => {
        console.error('게시글 불러오기 실패:', err);
        setError('게시글을 불러오는 중 오류가 발생했습니다.');
      });
  }, [postId]);

  if (error) {
    return <div className="board-container">{error}</div>;
  }

  if (!post) {
    return <div className="board-container">⏳ 게시글을 불러오는 중...</div>;
  }

  return (
    <div className="board-container">
      <div className="post-detail-header">
        <h2>{post.title}</h2>
        <div className="post-meta">
          <span>작성자: {post.authorNickname || post.author?.nickname || post.user?.nickname || '알 수 없음'}</span>
          <span>작성일: {new Date(post.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      <div className="post-content">
        {post.content}
      </div>
      <div className="back-button-area">
        <button onClick={() => navigate(-1)}>← 목록으로 돌아가기</button>
      </div>
    </div>
  );
}

export default BoardDetail;
