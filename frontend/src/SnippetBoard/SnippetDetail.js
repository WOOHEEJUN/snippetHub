// frontend/src/SnippetBoard/SnippetDetail.js
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { solarizedlight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FaHeart, FaRegHeart, FaComment, FaEye, FaPlay, FaTags, FaUser, FaCalendarAlt, FaCode, FaEdit, FaTrash, FaCopy } from 'react-icons/fa';
import '../css/SnippetDetail.css';

function SnippetDetail() {
  const { snippetId } = useParams();
  const navigate = useNavigate();
  const { user, getAuthHeaders } = useAuth();

  const [snippet, setSnippet] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editCommentId, setEditCommentId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [replyingToCommentId, setReplyingToCommentId] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  const fetchSnippet = useCallback(async () => {
    try {
      const res = await fetch(`/api/snippets/${snippetId}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('스니펫 불러오기 실패');
      const data = await res.json();
      setSnippet(data.data);
    } catch (err) {
      setError('스니펫을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [snippetId, getAuthHeaders]);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/snippets/${snippetId}/comments/all`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      setComments(Array.isArray(data) ? data : []);
    } catch (err) {
    }
  }, [snippetId, getAuthHeaders]);

  useEffect(() => {
    fetchSnippet();
    fetchComments();
  }, [fetchSnippet, fetchComments]);

  const handleEdit = () => navigate(`/snippets/edit/${snippetId}`);

  const handleDelete = async () => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/snippets/${snippetId}`, {
        method: 'DELETE',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('삭제 실패');
      alert('삭제되었습니다.');
      navigate('/snippets');
    } catch (err) {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await fetch(`/api/v1/snippets/${snippetId}/comments`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      });
      if (!res.ok) throw new Error('댓글 작성 실패');
      const newCommentData = await res.json();
      setComments((prev) => [...prev, newCommentData]);
      setNewComment('');
    } catch (err) {
    }
  };

  const handleCommentDelete = async (commentId) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('댓글 삭제 실패');
      setComments((prev) => prev.filter((c) => c.commentId !== commentId));
    } catch (err) {
    }
  };

  const handleCommentEdit = async (commentId) => {
    if (!editContent.trim()) return;
    try {
      const res = await fetch(`/api/v1/comments/${commentId}`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent, parentCommentId: 0 }),
      });
      if (!res.ok) throw new Error('댓글 수정 실패');
      const updatedCommentData = await res.json();
      setComments((prev) =>
        prev.map((c) =>
          c.commentId === commentId ? updatedCommentData : c
        )
      );
      setEditCommentId(null);
      setEditContent('');
      fetchComments(); // Refresh comments after saving
    } catch (err) {
    }
  };

  const handleReplySubmit = async (e, parentCommentId) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    try {
      const res = await fetch(`/api/v1/snippets/${snippetId}/comments`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: replyContent,
          parentCommentId: parentCommentId 
        }),
      });
      if (!res.ok) throw new Error('답글 작성 실패');
      const newReplyData = await res.json();
      
      // 댓글 목록을 새로고침하여 대댓글을 포함한 전체 구조를 가져옴
      const fetchComments = async () => {
        try {
          const res = await fetch(`/api/snippets/${snippetId}/comments/all`, {
            headers: getAuthHeaders(),
          });
          const data = await res.json();
          setComments(Array.isArray(data) ? data : []);
        } catch (err) {
          console.error('댓글 불러오기 실패:', err);
        }
      };
      fetchComments();
      
      setReplyContent('');
      setReplyingToCommentId(null);
    } catch (err) {
    }
  };

  const handleCancelReply = () => {
    setReplyingToCommentId(null);
    setReplyContent('');
  };

  const handleLike = async () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    try {
      const res = await fetch(`/api/snippets/${snippetId}/like`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || '좋아요 처리에 실패했습니다.');
      }

      // 좋아요 요청 성공 후 likeCount와 isLiked만 갱신
      const result = await res.json();
      setSnippet(prev => ({
        ...prev,
        isLiked: result.data?.isLiked ?? !prev.isLiked,
        likeCount: result.data?.likeCount ?? (prev.isLiked ? prev.likeCount - 1 : prev.likeCount + 1)
      }));

    } catch (err) {
      alert(err.message);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(snippet.code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;
  if (error) return <div className="error-container">{error}</div>;
  if (!snippet) return <div className="error-container">스니펫이 존재하지 않습니다.</div>;

  return (
    <div className="snippet-detail-page">
      <div className="snippet-main-content">
        <div className="snippet-header">
          <h1>{snippet.title}</h1>
          <p className="description">{snippet.description}</p>
        </div>

        <div className="code-block-container">
          <SyntaxHighlighter language={snippet.language?.toLowerCase()} style={solarizedlight} showLineNumbers>
            {snippet.code}
          </SyntaxHighlighter>
          <button onClick={copyToClipboard} className="copy-button">
            {isCopied ? <><FaCopy /> 복사됨!</> : <><FaCopy /> 복사</>}
          </button>
        </div>

        <div className="comment-section">
          <h3><FaComment /> 댓글 ({comments.length})</h3>
          <form onSubmit={handleCommentSubmit} className="comment-form">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="따뜻한 댓글을 남겨주세요."
            />
            <button type="submit">등록</button>
          </form>
          <div className="comment-list">
            {comments.map((comment) => {
              return (
                <div key={comment.commentId} className="comment-item">
                  <div className="comment-author">
                                          <img src={comment.author?.profileImage || '/default-profile.png'} alt={comment.author?.nickname || '사용자'} />
                      <Link to={`/users/${comment.author?.userId}`} className="author-link">
                        {comment.author?.nickname || comment.authorNickname || '알 수 없는 사용자'}
                      </Link>
                  </div>
                                  {editCommentId === comment.commentId ? (
                    <div className="comment-edit-form">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                      />
                      <button onClick={() => handleCommentEdit(comment.commentId)}>저장</button>
                      <button onClick={() => setEditCommentId(null)}>취소</button>
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
                              <button onClick={() => { setEditCommentId(comment.commentId); setEditContent(comment.content); }}><FaEdit /> 수정</button>
                              <button onClick={() => handleCommentDelete(comment.commentId)}><FaTrash /> 삭제</button>
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
                                 <Link to={`/users/${reply.author?.userId}`} className="author-link">
                                   {reply.author?.nickname || reply.authorNickname || '알 수 없는 사용자'}
                                 </Link>
                               </div>
                              <p className="comment-content">{reply.content}</p>
                              <div className="comment-meta">
                                <span>{new Date(reply.createdAt).toLocaleString()}</span>
                                {(user?.userId === reply.author?.userId || user?.userId === reply.authorId) && (
                                  <div className="comment-actions">
                                    <button onClick={() => handleCommentDelete(reply.commentId)}><FaTrash /> 삭제</button>
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

      <div className="snippet-sidebar">
        <div className="sidebar-card author-card">
          <h4><FaUser /> 작성자</h4>
          <div className="author-info">
            <img src={snippet.author?.profileImage || '/default-profile.png'} alt={snippet.author?.nickname} />
            <span>{snippet.author?.nickname}</span>
          </div>
        </div>

        <div className="sidebar-card info-card">
          <h4><FaCode /> 스니펫 정보</h4>
          <ul>
            <li><FaHeart className={snippet.isLiked ? 'liked' : ''} /> 좋아요 {snippet.likeCount}</li>
            <li><FaEye /> 조회수 {snippet.viewCount}</li>
            <li><FaPlay /> 실행 {snippet.runCount}회</li>
            <li><FaCalendarAlt /> {new Date(snippet.createdAt).toLocaleDateString()}</li>
            <li><strong>Language:</strong> {snippet.language}</li>
          </ul>
        </div>

        <div className="sidebar-card tags-card">
          <h4><FaTags /> 태그</h4>
          <div className="tags-list">
            {snippet.tags?.map((tag, i) => <span key={i} className="tag">#{tag}</span>)}
          </div>
        </div>
        
        <div className="sidebar-card actions-card">
            <button
              onClick={handleLike}
              className={`action-button like-button ${snippet.isLiked ? 'liked' : ''}`}
              style={{
                background: 'none',
                border: 'none',
                outline: 'none',
                cursor: 'pointer',
                fontSize: 24,
                color: snippet.isLiked ? '#e74c3c' : '#aaa',
                transition: 'color 0.2s'
              }}
              aria-label={snippet.isLiked ? '좋아요 취소' : '좋아요'}
            >
              {snippet.isLiked ? <FaHeart style={{ transition: 'transform 0.2s', transform: 'scale(1.2)' }} /> : <FaRegHeart />}
              <span style={{ marginLeft: 8, fontWeight: 'bold', fontSize: 18 }}>{snippet.likeCount}</span>
            </button>
            {user?.userId === snippet.author?.userId && (
            <>
                <button onClick={handleEdit} className="action-button edit-button"><FaEdit /> 수정하기</button>
                <button onClick={handleDelete} className="action-button delete-button"><FaTrash /> 삭제하기</button>
            </>
            )}
            <button onClick={() => navigate('/snippets')} className="action-button back-button">목록으로</button>
        </div>
      </div>
    </div>
  );
}

export default SnippetDetail;