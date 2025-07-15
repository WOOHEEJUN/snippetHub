import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../css/Board.css';

function BoardDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // 로그인 사용자 정보
  const [post, setPost] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/v1/posts/${postId}`)
      .then((res) => {
        if (!res.ok) throw new Error('응답 실패: ' + res.status);
        return res.json();
      })
      .then((data) => {
        setPost(data);
      })
      .catch((err) => {
        console.error('게시글 불러오기 실패:', err);
        setError('게시글을 불러오는 중 오류가 발생했습니다.');
      });
  }, [postId]);

  const handleEdit = () => {
    navigate(`/board/edit/${postId}`);
  };

  const handleDelete = () => {
    if (!window.confirm('정말 이 게시글을 삭제하시겠습니까?')) return;

    const token = localStorage.getItem('token');
    fetch(`/api/v1/posts/${postId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('삭제 실패');
        alert('삭제되었습니다.');
        navigate('/board');
      })
      .catch((err) => {
        console.error('삭제 오류:', err);
        alert('삭제 중 오류가 발생했습니다.');
      });
  };

  if (error)
    return (
      <div className="container text-center py-5">
        <p className="text-danger">{error}</p>
      </div>
    );

  if (!post)
    return (
      <div className="container text-center py-5">
        <div className="spinner-border text-secondary" role="status"></div>
        <p className="mt-3">⏳ 게시글을 불러오는 중...</p>
      </div>
    );

  const authorNickname =
    post.authorNickname || post.author?.nickname || post.user?.nickname || '알 수 없음';

  const isAuthor = user?.nickname === authorNickname;

  return (
    <div className="container post-detail-container col-lg-8 mx-auto p-4 shadow rounded-4 bg-white">
      <div className="post-header mb-4 border-bottom pb-3">
        <h2 className="fw-bold mb-3">{post.title}</h2>
        <div className="post-meta d-flex flex-wrap gap-3 text-muted small">
          <span>👤 {authorNickname}</span>
          <span>🗓️ {new Date(post.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="post-content mb-4" style={{ whiteSpace: 'pre-wrap', fontSize: '1.1rem' }}>
        {post.content}
      </div>

      {isAuthor && (
        <div className="post-actions d-flex justify-content-end gap-2 mt-4">
          <button className="btn btn-outline-primary px-4" onClick={handleEdit}>
            수정
          </button>
          <button className="btn btn-outline-danger px-4" onClick={handleDelete}>
            삭제
          </button>
        </div>
      )}

      <div className="mt-5 text-center">
        <button
          className="btn btn-secondary px-4"
          onClick={() => navigate(-1)}
        >
          ← 목록으로 돌아가기
        </button>
      </div>
    </div>
  );
}

export default BoardDetail;
