// frontend/src/Board/BoardDetail.js
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaComment, FaEye, FaUser, FaCalendarAlt, FaEdit, FaTrash, FaThumbsUp, FaTag } from 'react-icons/fa';
import { AiFillHeart, AiOutlineHeart } from 'react-icons/ai';
import { getLevelBadgeImage } from '../utils/badgeUtils'; // 뱃지 유틸리티 임포트
import '../css/BoardDetail.css';

const MOCK_ENABLED = false;

function BoardDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // ✅ getAuthHeaders 제거
  const [post, setPost] = useState(null);
  const [error, setError] = useState('');
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  const [replyingToCommentId, setReplyingToCommentId] = useState(null);
  const [replyContent, setReplyContent] = useState('');

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
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || '좋아요 처리에 실패했습니다.');
      }

      // 좋아요 요청 성공 후 likeCount와 isLiked만 갱신
      const result = await res.json();
      
      setPost(prev => ({
        ...prev,
        isLiked: result.data?.isLiked ?? !prev.isLiked,
        likeCount: result.data?.likeCount ?? (prev.isLiked ? prev.likeCount - 1 : prev.likeCount + 1)
      }));
    } catch (err) {
      alert(err.message);
      
    }
  };

  // ✅ 직접 정의한 getAuthHeaders 사용
  const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchPostData = useCallback(async () => {
    try {
      const [postRes, commentsRes] = await Promise.all([
        fetch(`/api/posts/${postId}`, { headers: getAuthHeaders(), credentials: 'include' }),
        fetch(`/api/v1/posts/${postId}/comments/all`, { headers: getAuthHeaders(), credentials: 'include' })
      ]);

      if (!postRes.ok) throw new Error('게시글 정보를 불러올 수 없습니다.');
      const postData = await postRes.json();
      const actualPost = postData.data;
      setPost(actualPost);

      if (commentsRes.ok) {
        const commentsData = await commentsRes.json();
        
        const commentsArray = Array.isArray(commentsData) ? commentsData : [];
        setComments(commentsArray);
      }
    } catch (err) {
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    }
  }, [postId]);

  useEffect(() => {
    fetchPostData();
  }, [fetchPostData, postId]);

  const handleEdit = () => navigate(`/board/edit/${postId}`);

 const handleDelete = async () => {
    if (!window.confirm('정말 이 게시글을 삭제하시겠습니까?')) return;
    if (!user) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    const headers = getAuthHeaders();
    const url = `/api/posts/${postId}`;

    try {
      const res = await fetch(url, {
          method: 'DELETE',
          headers: { ...headers, 'Content-Type': 'application/json' },
          credentials: 'include',
      });

      const resText = await res.text();

      if (!res.ok) {
        throw new Error(`삭제 실패: ${res.status} - ${resText}`);
      }

      alert('삭제되었습니다.');
      navigate('/board');
    } catch (err) {
      alert(`삭제 중 오류가 발생했습니다: ${err.message}`);
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
      const res = await fetch(`/api/v1/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('댓글 작성 실패');
      const newCommentData = await res.json();
      
      setComments(prevComments => [...prevComments, newCommentData]); // 서버 응답에서 실제 데이터 사용
      setNewComment('');
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
      const res = await fetch(`/api/v1/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: editingCommentContent, parentCommentId: 0 }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('댓글 수정 실패');
      const updatedCommentData = await res.json();
      setComments(prevComments => 
        prevComments.map(c => c.commentId === commentId ? updatedCommentData : c)
      );
      setEditingCommentId(null);
      setEditingCommentContent('');
      fetchPostData(); // Refresh comments after saving
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('정말 이 댓글을 삭제하시겠습니까?')) return;
    try {
      let res;
      if (MOCK_ENABLED) {
        setComments(prevComments => prevComments.filter(c => c.commentId !== commentId));
        res = { ok: true, status: 200 }; // Simulate successful deletion
      } else {
        res = await fetch(`/api/v1/comments/${commentId}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
          credentials: 'include',
        });
      }
      if (!res.ok) throw new Error('댓글 삭제 실패');
      setComments(prevComments => prevComments.filter(c => c.commentId !== commentId));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReplySubmit = async (e, parentCommentId) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    if (!user) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }
    try {
      const res = await fetch(`/api/v1/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          content: replyContent,
          parentCommentId: parentCommentId 
        }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('답글 작성 실패');
      const newReplyData = await res.json();
      
      
      // 댓글 목록을 새로고침하여 대댓글을 포함한 전체 구조를 가져옴
      fetchPostData();
      
      setReplyContent('');
      setReplyingToCommentId(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCancelReply = () => {
    setReplyingToCommentId(null);
    setReplyContent('');
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
            <span className="author-info-inline">
              <FaUser /> 
              {post.author?.userId ? (
                <Link to={`/users/${post.author.userId}`}>
                  {post.author?.level && <img src={getLevelBadgeImage(post.author.level)} alt={post.author.level} className="level-badge-inline" />}
                  {post.author?.nickname}
                </Link>
              ) : (
                <>
                  {post.author?.level && <img src={getLevelBadgeImage(post.author.level)} alt={post.author.level} className="level-badge-inline" />}
                  {post.author?.nickname}
                </>
              )}
            </span>
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
          <button
  onClick={handleLike}
  className={`action-button like-button ${post.isLiked ? 'liked' : ''}`}
  style={{
    background: 'none',
    border: 'none',
    outline: 'none',
    cursor: 'pointer',
    fontSize: 24,
    color: post.isLiked ? '#e74c3c' : '#aaa',
    transition: 'color 0.2s'
  }}
  aria-label={post.isLiked ? '좋아요 취소' : '좋아요'}
>
  {post.isLiked
    ? <AiFillHeart style={{ transition: 'transform 0.2s', transform: 'scale(1.2)' }} />
    : <AiOutlineHeart />}
  <span style={{ marginLeft: 8, fontWeight: 'bold', fontSize: 18 }}>{post.likeCount}</span>
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
            {comments.map((comment) => {
              
              return (
                <div key={comment.commentId} className="comment-item">
                  <div className="comment-author">
                    <img src={comment.author?.profileImage || '/default-profile.png'} alt={comment.author?.nickname || '사용자'} />
                    {comment.author?.userId ? (
                      <Link to={`/users/${comment.author.userId}`} className="author-link">
                        {comment.author?.level && <img src={getLevelBadgeImage(comment.author.level)} alt={comment.author.level} className="level-badge-inline" />}
                        {comment.author?.nickname || comment.authorNickname || '알 수 없는 사용자'}
                      </Link>
                    ) : (
                      <span className="author-link">
                        {comment.author?.level && <img src={getLevelBadgeImage(comment.author.level)} alt={comment.author.level} className="level-badge-inline" />}
                        {comment.author?.nickname || comment.authorNickname || '알 수 없는 사용자'}
                      </span>
                    )}
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
                        <div className="comment-actions">
                          <button onClick={() => setReplyingToCommentId(comment.commentId)}>답글</button>
                          {(user?.userId === comment.author?.userId || user?.userId === comment.authorId) && (
                            <>
                              <button onClick={() => handleEditComment(comment)}><FaEdit /> 수정</button>
                              <button onClick={() => handleDeleteComment(comment.commentId)}><FaTrash /> 삭제</button>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* 답글 작성 폼 */}
                      {replyingToCommentId === comment.commentId && (
                        <div className="reply-form">
                          <form onSubmit={(e) => handleReplySubmit(e, comment.commentId)}>
                            <textarea
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              placeholder="답글을 입력하세요..."
                            />
                            <button type="submit">답글 작성</button>
                            <button type="button" onClick={handleCancelReply}>취소</button>
                          </form>
                        </div>
                      )}
                      
                      {/* 대댓글 목록 */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="replies-container">
                          {comment.replies.map((reply) => (
                            <div key={reply.commentId} className="reply-item" style={{ marginLeft: '20px', borderLeft: '2px solid #e0e0e0', paddingLeft: '10px' }}>
                                                             <div className="comment-author">
                                 <img src={reply.author?.profileImage || '/default-profile.png'} alt={reply.author?.nickname || '사용자'} />
                                 {reply.author?.userId ? (
                                   <Link to={`/users/${reply.author.userId}`} className="author-link">
                                     {reply.author?.level && <img src={getLevelBadgeImage(reply.author.level)} alt={reply.author.level} className="level-badge-inline" />}
                                     {reply.author?.nickname || reply.authorNickname || '알 수 없는 사용자'}
                                   </Link>
                                 ) : (
                                   <span className="author-link">
                                     {reply.author?.level && <img src={getLevelBadgeImage(reply.author.level)} alt={reply.author.level} className="level-badge-inline" />}
                                     {reply.author?.nickname || reply.authorNickname || '알 수 없는 사용자'}
                                   </span>
                                 )}
                               </div>
                              <p className="comment-content">{reply.content}</p>
                              <div className="comment-meta">
                                <span>{new Date(reply.createdAt).toLocaleString()}</span>
                                {(user?.userId === reply.author?.userId || user?.userId === reply.authorId) && (
                                  <div className="comment-actions">
                                    <button onClick={() => handleDeleteComment(reply.commentId)}><FaTrash /> 삭제</button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="post-sidebar">
        <div className="sidebar-card author-card">
          <h4><FaUser /> 작성자</h4>
          <div className="author-info">
            <img src={post.author?.profileImage || '/default-profile.png'} alt={post.author?.nickname} />
            {post.author?.userId ? (
              <Link to={`/users/${post.author.userId}`}>
                {post.author?.level && <img src={getLevelBadgeImage(post.author.level)} alt={post.author.level} className="level-badge-inline" />}
                <span>{post.author?.nickname}</span>
              </Link>
            ) : (
              <>
                {post.author?.level && <img src={getLevelBadgeImage(post.author.level)} alt={post.author.level} className="level-badge-inline" />}
                <span>{post.author?.nickname}</span>
              </>
            )}
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