import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './BoardDetail.css';

function BoardDetail() {
  const { postId } = useParams();
  const [post, setPost] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');

    fetch(`/api/v1/posts/${postId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('게시글 불러오기 실패');
        return res.json();
      })
      .then((data) => {
        console.log('받아온 게시글 데이터:', data);
        setPost(data);
      })
      .catch((err) => console.error('에러:', err));
  }, [postId]);

  if (!post) {
    return <div style={{ padding: '2rem' }}>📄 게시글을 불러오는 중입니다...</div>;
  }

  return (
    <div className="board-detail-container" style={{ padding: '2rem' }}>
      <h2>{post.title}</h2>
      <p><strong>작성자:</strong> {post.author?.nickname}</p>
      <p><strong>작성일:</strong> {new Date(post.createdAt).toLocaleString()}</p>
      <p><strong>추천수:</strong> {post.likes}</p>
      <hr />
      <div className="post-content" style={{ whiteSpace: 'pre-line' }}>
        {post.content}
      </div>
    </div>
  );
}

export default BoardDetail;
