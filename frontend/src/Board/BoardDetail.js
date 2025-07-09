import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './BoardDetail.css';

function BoardDetail() {
  const { postId } = useParams(); // URL에서 postId 추출
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const url = `/api/v1/posts/${postId}`;

    console.log('📡 요청 URL:', url);
    console.log('🔑 토큰:', token);

    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`❌ 응답 실패: ${res.status}`);
        const text = await res.text();

        if (!text) {
          console.warn('⚠️ 응답 본문이 비어 있습니다.');
          return null;
        }

        const data = JSON.parse(text);
        console.log('✅ 게시글 데이터:', data);
        setPost(data);
      })
      .catch((err) => {
        console.error('❌ 에러 발생:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [postId]);

  if (loading) {
    return <div style={{ padding: '2rem' }}>📄 게시글을 불러오는 중입니다...</div>;
  }

  if (!post) {
    return <div style={{ padding: '2rem', color: 'gray' }}>❌ 게시글을 찾을 수 없습니다.</div>;
  }

  return (
    <div className="board-detail-container" style={{ padding: '2rem' }}>
      <h2>{post.title}</h2>
      <p><strong>작성자:</strong> {post.author?.nickname}</p>
      <p><strong>작성일:</strong> {new Date(post.createdAt).toLocaleString()}</p>
      <p><strong>추천수:</strong> {post.likes ?? 0}</p>
      <hr />
      <div className="post-content" style={{ whiteSpace: 'pre-line' }}>
        {post.content}
      </div>
    </div>
  );
}

export default BoardDetail;
