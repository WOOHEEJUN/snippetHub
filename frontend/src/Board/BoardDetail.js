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
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');

  const fetchPostData = useCallback(async () => {
    try {
      const [postRes, commentsRes] = await Promise.all([
        fetch(`/api/posts/${postId}`),
        fetch(`/api/posts/${postId}/comments`)
      ]);

      if (!postRes.ok) throw new Error('게시글 정보를 불러올 수 없습니다.');
      const postData = await postRes.json();

      const actualPost = postData.data;
      setPost(actualPost);
      setLikeCount(actualPost.likeCount || 0);
      setIsLiked(actualPost.likedByCurrentUser || false);

      if (commentsRes.ok) {
        const commentsData = await commentsRes.json();
        setComments(commentsData.data && Array.isArray(commentsData.data) ? commentsData.data : []);
      }
    } catch (err) {
      console.error('데이터 불러오기 실패:', err);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    }
  }, [postId]);

  useEffect(() => {
    fetchPostData();
  }, [fetchPostData]);

  const handleEdit = () => {
    navigate(`/board/edit/${postId}`);
  };

  const handleDelete = async () => {
    if (!window.confirm('정말 이 게시글을 삭제하시겠습니까?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('삭제 실패');
      alert('삭제되었습니다.');
      navigate('/board');
    } catch (err) {
      console.error('삭제 오류:', err);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleLike = async () => {
    if (!user) return alert('로그인이 필요합니다.');
    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('좋아요 요청 실패');
      const result = await res.json();
      const liked = result.isLiked ?? result.data ?? false;
      setIsLiked(liked);
      setLikeCount(prev => liked ? prev + 1 : prev - 1);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment }),
      });
      if (!res.ok) throw new Error('댓글 작성 실패');
      setNewComment('');
      fetchPostData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEditComment = (comment) => {
    setEditingCommentId(comment.commentId);
    setEditingCommentContent(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingCommentContent('');
  };

  const handleSaveComment = async (commentId) => {
    if (!editingCommentContent.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: editingCommentContent }),
      });
      if (!res.ok) throw new Error('댓글 수정 실패');
      setEditingCommentId(null);
      setEditingCommentContent('');
      fetchPostData(); // 댓글 목록 새로고침
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('정말 이 댓글을 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('댓글 삭제 실패');
      fetchPostData(); // 댓글 목록 새로고침
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

  const authorNickname = post.author?.nickname || '알 수 없음';
  const isAuthor = user?.nickname === authorNickname;

  return (
    <div className="container post-detail-container col-lg-8 mx-auto p-4 shadow rounded-4 bg-white">
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
          <button className="btn btn-outline-primary px-4" onClick={handleEdit}>수정</button>
          <button className="btn btn-outline-danger px-4" onClick={handleDelete}>삭제</button>
        </div>
      )}

      <div className="mt-5 text-center">
        <button className="btn btn-secondary px-4" onClick={() => navigate(-1)}>← 목록으로 돌아가기</button>
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
              {editingCommentId === comment.commentId ? (
                <div className="input-group">
                  <textarea
                    className="form-control"
                    rows="2"
                    value={editingCommentContent}
                    onChange={(e) => setEditingCommentContent(e.target.value)}
                  ></textarea>
                  <button className="btn btn-primary" onClick={() => handleSaveComment(comment.commentId)}>저장</button>
                  <button className="btn btn-secondary" onClick={handleCancelEdit}>취소</button>
                </div>
              ) : (
                <>
                  <div className="d-flex justify-content-between">
                    <span className="comment-author">{comment.author?.nickname}</span>
                    <span className="comment-date">{new Date(comment.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="mt-2 mb-0">{comment.content}</p>
                  {user && user.nickname === comment.author?.nickname && (
                    <div className="comment-actions d-flex justify-content-end gap-2 mt-2">
                      <button className="btn btn-sm btn-outline-secondary" onClick={() => handleEditComment(comment)}>수정</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteComment(comment.commentId)}>삭제</button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default BoardDetail;
