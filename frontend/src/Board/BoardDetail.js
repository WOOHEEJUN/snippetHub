// src/Board/BoardDetail.js
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaHeart, FaComment, FaEye, FaUser, FaCalendarAlt, FaEdit, FaTrash, FaThumbsUp, FaTag } from 'react-icons/fa';
import '../css/BoardDetail.css';

function BoardDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user, getAuthHeaders } = useAuth();
  const [post, setPost] = useState(null);
  const [error, setError] = useState('');
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');

  const fetchPostData = useCallback(async () => {
    try {
      const [postRes, commentsRes] = await Promise.all([
        fetch(`/api/posts/${postId}`, { headers: getAuthHeaders() }),
        fetch(`/api/posts/${postId}/comments`, { headers: getAuthHeaders() })
      ]);

      if (!postRes.ok) throw new Error('게시글 정보를 불러올 수 없습니다.');
      const postData = await postRes.json();
      const actualPost = postData.data;
      setPost(actualPost);

      if (commentsRes.ok) {
        const commentsData = await commentsRes.json();
        setComments(Array.isArray(commentsData.data) ? commentsData.data : []);
      }
    } catch (err) {
      console.error('데이터 불러오기 실패:', err);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    }
  }, [postId]);

  useEffect(() => {
    fetchPostData();
  }, [fetchPostData]);

  const handleEdit = () => navigate(`/board/edit/${postId}`);

  const handleDelete = async () => {
    if (!window.confirm('정말 이 게시글을 삭제하시겠습니까?')) return;
    if (!user) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('삭제 실패 응답 본문:', errorText);
        throw new Error(`삭제 실패: ${res.status} - ${errorText}`);
      }

      alert('삭제되었습니다.');
      navigate('/board');
    } catch (err) {
      console.error('삭제 오류:', err);
      alert(`삭제 중 오류가 발생했습니다: ${err.message}`);
    }
  };

  const handleLike = async () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }
    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || '좋아요 처리에 실패했습니다.');
      }
      fetchPostData(); // 좋아요 상태 변경 후 데이터 다시 불러오기
    } catch (err) {
      alert(err.message);
      console.error('좋아요 처리 실패:', err);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!user) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }
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
      fetchPostData();
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
      fetchPostData();
    } catch (err) {
      alert(err.message);
    }
  };

  if (error) return <div className="container text-center py-5 text-danger">{error}</div>;
  if (!post) return (
    <div className="container text-center py-5">
      <div className="spinner-border text-secondary" role="status"></div>
      <p className="mt-3">⏳ 게시글을 불러오는 중...</p>
    </div>
  );

  const isAuthor = user?.userId === post.author?.userId;

  return (
    <div className="board-detail-page">
      <div className="post-main-content">
        <div className="post-header">
          <h1>{post.title}</h1>
          <div className="post-meta-info">
            <span className="category-info-inline"><FaTag /> {post.category}</span>
            <span className="author-info-inline"><FaUser /> {post.author?.nickname}</span>
            <span className="date-info-inline"><FaCalendarAlt /> {new Date(post.createdAt).toLocaleDateString()}</span>
            <span className="view-info-inline"><FaEye /> {post.viewCount}</span>
          </div>
        </div>

        <div className="post-content-body">
          {post.content}
          {post.imageUrl && (
            <div className="post-image-container">
              <img src={post.imageUrl} alt="게시글 이미지" />
            </div>
          )}
        </div>

        <div className="post-actions-top">
          <button onClick={handleLike} className={`action-button like-button ${post.likedByCurrentUser ? 'liked' : ''}`}>
            <FaHeart /> {post.likedByCurrentUser ? '좋아요 취소' : '좋아요'} ({post.likeCount})
          </button>
        </div>

        <div className="comment-section">
          <h3><FaComment /> 댓글 ({comments.length})</h3>
          <form onSubmit={handleCommentSubmit} className="comment-form">
            <textarea
              id="comment-input"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="댓글을 남겨주세요."
            />
            <button type="submit">등록</button>
          </form>
          <div className="comment-list">
            {comments.map((comment) => (
              <div key={comment.commentId} className="comment-item">
                <div className="comment-author">
                  <img src={comment.author?.profileImage || '/default-profile.png'} alt={comment.author?.nickname} />
                  <span>{comment.author?.nickname}</span>
                </div>
                {editingCommentId === comment.commentId ? (
                  <div className="comment-edit-form">
                    <textarea
                      value={editingCommentContent}
                      onChange={(e) => setEditingCommentContent(e.target.value)}
                    />
                    <button onClick={() => handleSaveComment(comment.commentId)}>저장</button>
                    <button onClick={handleCancelEdit}>취소</button>
                  </div>
                ) : (
                  <>
                    <p className="comment-content">{comment.content}</p>
                    <div className="comment-meta">
                      <span>{new Date(comment.createdAt).toLocaleString()}</span>
                      {user?.userId === comment.author?.userId && (
                        <div className="comment-actions">
                          <button onClick={() => handleEditComment(comment)}><FaEdit /> 수정</button>
                          <button onClick={() => handleDeleteComment(comment.commentId)}><FaTrash /> 삭제</button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="post-sidebar">
        <div className="sidebar-card author-card">
          <h4><FaUser /> 작성자</h4>
          <div className="author-info">
            <img src={post.author?.profileImage || '/default-profile.png'} alt={post.author?.nickname} />
            <span>{post.author?.nickname}</span>
          </div>
        </div>

        <div className="sidebar-card info-card">
          <h4><FaThumbsUp /> 게시글 정보</h4>
          <ul>
            <li><FaCalendarAlt /> {new Date(post.createdAt).toLocaleDateString()}</li>
          </ul>
        </div>

        <div className="sidebar-card actions-card">
          {isAuthor && (
            <>
              <button onClick={handleEdit} className="action-button edit-button"><FaEdit /> 수정하기</button>
              <button onClick={handleDelete} className="action-button delete-button"><FaTrash /> 삭제하기</button>
            </>
          )}
          <button onClick={() => navigate('/board')} className="action-button back-button">목록으로</button>
        </div>
      </div>
    </div>
  );
}

export default BoardDetail;
