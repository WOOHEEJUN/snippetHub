import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../css/Board.css';

function BoardDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user, getAuthHeaders } = useAuth(); // 로그인 사용자 정보
  const [post, setPost] = useState(null);
  const [error, setError] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const fetchPostData = useCallback(async () => {
    try {
      const [postRes, likeRes] = await Promise.all([
        fetch(`/api/v1/posts/${postId}`),
        fetch(`/api/v1/posts/${postId}/likes/status`, { headers: getAuthHeaders() })
      ]);

      if (!postRes.ok) throw new Error('게시글 정보를 불러올 수 없습니다.');
      const postData = await postRes.json();
      setPost(postData);
      setLikeCount(postData.likeCount);

      if (likeRes.ok) {
        const likeData = await likeRes.json();
        setIsLiked(likeData.liked);
      }

    } catch (err) {
      console.error('데이터 불러오기 실패:', err);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    }
  }, [postId, getAuthHeaders]);

  useEffect(() => {
    fetchPostData();
  }, [fetchPostData]);

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

  const handleLike = async () => {
    if (!user) return alert('로그인이 필요합니다.');
    try {
      const response = await fetch(`/api/v1/likes/posts/${postId}`, {
        method: isLiked ? 'DELETE' : 'POST',
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('요청 실패');
      
      // 성공 시 상태 업데이트
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev - 1 : prev + 1);

    } catch (err) {
      console.error(err);
    }
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

      <div className="like-section text-center my-4">
        <button onClick={handleLike} className={`like-button ${isLiked ? 'liked' : ''}`}>
            <i className={`bi ${isLiked ? 'bi-heart-fill' : 'bi-heart'}`}></i>
        </button>
        <span className="fw-bold ms-2">{likeCount}</span>
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
