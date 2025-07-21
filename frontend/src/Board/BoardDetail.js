import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../css/Board.css';

function BoardDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user, getAuthHeaders } = useAuth();
  const [post, setPost] = useState(null);
  const [error, setError] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  const fetchPostData = useCallback(async () => {
    try {
      const [postRes, commentsRes] = await Promise.all([
        fetch(`/api/posts/${postId}`),
        fetch(`/api/posts/${postId}/comments`)
      ]);

      if (!postRes.ok) throw new Error('게시글 정보를 불러올 수 없습니다.');
      const postData = await postRes.json();
      setPost(postData);
      setLikeCount(postData.likeCount);

      // isLiked 상태는 백엔드에서 직접 제공하지 않으므로, 초기에는 false로 설정하거나
      // 사용자별 좋아요 여부를 가져오는 별도의 API가 필요합니다.
      // 현재는 postData에 isLiked 정보가 없으므로, 좋아요 버튼 클릭 시 토글 로직만 구현합니다.
      setIsLiked(false); // 초기 상태는 false로 설정

      if (commentsRes.ok) {
        const commentsData = await commentsRes.json();
        setComments(commentsData.content || []);
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
    fetch(`/api/posts/${postId}`, {
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
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('요청 실패');
      
      // 백엔드에서 토글 결과를 반환한다고 가정
      const result = await response.json();
      setIsLiked(result.data); // 백엔드에서 isLiked 값을 반환한다고 가정
      setLikeCount(prev => result.data ? prev + 1 : prev - 1); // 백엔드 결과에 따라 좋아요 수 업데이트

    } catch (err) {
      console.error(err);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment }),
      });
      if (!response.ok) throw new Error('댓글 작성 실패');
      setNewComment('');
      fetchPostData();
    } catch (err) {
      alert(err.message);
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
        <span className="like-count">{likeCount}</span>
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
        <button className="btn btn-secondary px-4" onClick={() => navigate(-1)}>
          ← 목록으로 돌아가기
        </button>
      </div>

      <div className="comment-section mt-5">
        <h4 className="mb-4">댓글 ({comments.length})</h4>
        {user && (
          <form onSubmit={handleCommentSubmit} className="mb-4">
            <div className="input-group">
              <textarea
                className="form-control comment-form-textarea"
                rows="3"
                placeholder="댓글을 입력하세요..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
              ></textarea>
              <button className="btn btn-primary" type="submit">등록</button>
            </div>
          </form>
        )}
        <div className="comment-list">
          {comments.map(comment => (
            <div key={comment.commentId} className="comment mb-3">
              <div className="d-flex justify-content-between">
                <span className="comment-author">{comment.author?.nickname}</span>
                <span className="comment-date">{new Date(comment.createdAt).toLocaleString()}</span>
              </div>
              <p className="mt-2 mb-0">{comment.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default BoardDetail;
