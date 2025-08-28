import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { solarizedlight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  FaHeart, FaRegHeart, FaComment, FaEye, FaTags, FaUser,
  FaCalendarAlt, FaCode, FaEdit, FaTrash, FaCopy
} from 'react-icons/fa';
import AICodeEvaluation from '../components/AICodeEvaluation';

import '../css/SnippetDetail.css';
import UserBadgeAndNickname from '../components/UserBadgeAndNickname';

const API_BASE = '/api';
const ENDPOINTS = {
  snippet: (id) => `${API_BASE}/snippets/${id}`,
  snippetLike: (id) => `${API_BASE}/snippets/${id}/like`,
  commentsAllBySnippet: (id) => `${API_BASE}/snippets/${id}/comments/all`,
  commentsBySnippet: (id) => `${API_BASE}/snippets/${id}/comments`,
  comment: (commentId) => `${API_BASE}/comments/${commentId}`,
};

const apiFetch = async (path, init = {}) => {
  const res = await fetch(path, { ...init, credentials: 'include' });
  if (!res.ok) {
    let bodyText = '';
    try { bodyText = await res.clone().text(); } catch { /* noop */ }
    console.error(`[API ERROR] ${init.method || 'GET'} ${path} -> ${res.status}, ${bodyText}`);
  }
  return res;
};

const parseJsonSafe = async (res) => {
  try {
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) return await res.json();
  } catch { /* noop */ }
  return null;
};

const removeCommentFromTree = (list, targetId) =>
  list
    .filter((c) => c.commentId !== targetId)
    .map((c) => ({
      ...c,
      replies: c.replies ? removeCommentFromTree(c.replies, targetId) : [],
    }));

async function deleteCommentById(commentId, headers) {
  try {
    const res = await apiFetch(ENDPOINTS.comment(commentId), {
      method: 'DELETE',
      headers,
    });
    if (res.status === 204) return { ok: true, msg: '삭제됨' };
    const body = await parseJsonSafe(res);
    return { ok: res.ok, msg: body?.message || res.statusText };
  } catch (e) {
    return { ok: false, msg: e?.message || '삭제 실패' };
  }
}

function SnippetDetail() {
  const { snippetId } = useParams();
  const navigate = useNavigate();
  const { user, getAuthHeaders } = useAuth();

  const [snippet, setSnippet] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [replyingToCommentId, setReplyingToCommentId] = useState(null);
  const [editCommentId, setEditCommentId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isAIExpanded, setIsAIExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [authorProfiles, setAuthorProfiles] = useState({});

  const fetchUserProfiles = useCallback(async () => {
    try {
      const [allBadgesRes, rankingRes] = await Promise.all([
        fetch(`/api/v1/badges/users/featured`, { headers: getAuthHeaders(), credentials: 'include' }),
        fetch(`/api/users/ranking?size=2000`, { headers: getAuthHeaders(), credentials: 'include' })
      ]);

      const allBadges = allBadgesRes.ok ? await allBadgesRes.json().then(data => data.data || []) : [];
      const badgeMap = new Map(allBadges.map(b => [b.userId, b]));

      const usersFromRanking = rankingRes.ok ? await rankingRes.json().then(data => data.data?.content || []) : [];

      const profiles = {};
      usersFromRanking.forEach(user => {
        profiles[user.userId] = {
          ...user,
          representativeBadge: badgeMap.get(user.userId) || null,
        };
      });

      setAuthorProfiles(profiles);
    } catch (err) {
      console.error('Failed to fetch user profiles:', err);
    }
  }, [getAuthHeaders]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [snippetRes, commentsRes] = await Promise.all([
        apiFetch(ENDPOINTS.snippet(snippetId), { headers: getAuthHeaders() }),
        apiFetch(ENDPOINTS.commentsAllBySnippet(snippetId), { headers: getAuthHeaders() })
      ]);

      if (!snippetRes.ok) throw new Error('스니펫 불러오기 실패');
      const snippetData = await parseJsonSafe(snippetRes);
      const finalSnippet = snippetData?.data ?? snippetData;
      setSnippet(finalSnippet);

      let commentsData = [];
      if (commentsRes.ok) {
        const commentsJson = await parseJsonSafe(commentsRes);
        commentsData = Array.isArray(commentsJson) ? commentsJson : (Array.isArray(commentsJson?.data) ? commentsJson.data : []);
        setComments(commentsData);
      }
    } catch (err) {
      console.error(err);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [snippetId, getAuthHeaders]);

  useEffect(() => {
    fetchData();
    fetchUserProfiles();
  }, [fetchData, fetchUserProfiles]);

  const handleEdit = () => navigate(`/snippets/edit/${snippetId}`);

  const handleDelete = async () => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      const res = await apiFetch(ENDPOINTS.snippet(snippetId), {
        method: 'DELETE',
        headers: { ...getAuthHeaders() },
      });

      if (res.status === 204) {
        alert('삭제되었습니다.');
        navigate('/snippets');
        return;
      }

      const body = await parseJsonSafe(res);
      const msg = body?.message || res.statusText || '';

      if (res.status === 401) { alert(msg || '로그인이 필요합니다.'); navigate('/login'); return; }
      if (res.status === 403) { alert(msg || '삭제 권한이 없습니다.'); return; }
      if (res.status === 404) { alert(msg || '해당 스니펫을 찾을 수 없습니다.'); return; }

      if (res.ok) {
        if (body?.success === true) {
          alert(body.message || '삭제되었습니다.');
          navigate('/snippets');
        } else {
          alert(body?.message || '삭제 실패');
        }
        return;
      }

      alert(msg || `삭제 실패 (status: ${res.status})`);
    } catch (err) {
      console.error(err);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleLike = async () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    try {
      const res = await apiFetch(ENDPOINTS.snippetLike(snippetId), {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      const body = await parseJsonSafe(res);
      if (!res.ok || body?.success === false) throw new Error(body?.message || '좋아요 처리에 실패했습니다.');

      setSnippet((prev) => ({
        ...prev,
        isLiked: body?.data?.isLiked ?? !prev.isLiked,
        likeCount: body?.data?.likeCount ?? (prev.isLiked ? prev.likeCount - 1 : prev.likeCount + 1),
      }));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await apiFetch(ENDPOINTS.commentsBySnippet(snippetId), {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      });
      const body = await parseJsonSafe(res);
      if (!res.ok || body?.success === false) throw new Error(body?.message || '댓글 작성 실패');

      setNewComment('');
      await fetchData();
    } catch (err) {
      console.error(err);
      alert(err.message || '댓글 작성 중 오류가 발생했습니다.');
    }
  };

  const handleCommentEdit = async (commentId) => {
    if (!editContent.trim()) return;

    try {
      const res = await apiFetch(ENDPOINTS.comment(commentId), {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent, parentCommentId: 0 }),
      });
      const body = await parseJsonSafe(res);
      if (!res.ok || body?.success === false) throw new Error(body?.message || '댓글 수정 실패');

      setEditCommentId(null);
      setEditContent('');
      await fetchData();
    } catch (err) {
      console.error(err);
      alert(err.message || '댓글 수정 중 오류가 발생했습니다.');
    }
  };

  const handleCommentDelete = async (commentId) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;
    const result = await deleteCommentById(commentId, getAuthHeaders());
    if (!result.ok) {
      alert(result.msg);
      if (result.msg.includes('로그인')) navigate('/login');
      return;
    }
    setComments((prev) => removeCommentFromTree(prev, commentId));
    await fetchData();
  };

  const handleReplySubmit = async (e, parentCommentId) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    try {
      const res = await apiFetch(ENDPOINTS.commentsBySnippet(snippetId), {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent, parentCommentId }),
      });
      const body = await parseJsonSafe(res);
      if (!res.ok || body?.success === false) throw new Error(body?.message || '답글 작성 실패');

      setReplyContent('');
      setReplyingToCommentId(null);
      await fetchData();
    } catch (err) {
      console.error(err);
      alert(err.message || '답글 작성 중 오류가 발생했습니다.');
    }
  };

  const copyToClipboard = () => {
    if (!snippet?.code) return;
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

          <button
            onClick={handleLike}
            className={`like-button ${snippet.isLiked ? 'liked' : ''}`}
            style={{
              background: 'none',
              border: 'none',
              outline: 'none',
              cursor: 'pointer',
              fontSize: 24,
              display: 'flex',
              alignItems: 'center',
              color: snippet.isLiked ? '#e74c3c' : '#aaa',
              transition: 'color 0.2s'
            }}
            aria-label={snippet.isLiked ? '좋아요 취소' : '좋아요'}
          >
            {snippet.isLiked
              ? <FaHeart style={{ transition: 'transform 0.2s', transform: 'scale(1.2)' }} />
              : <FaRegHeart />}
            <span style={{ marginLeft: 8, fontWeight: 'bold', fontSize: 18 }}>{snippet.likeCount}</span>
          </button>
        </div>

        <div className={`ai-evaluation-section ${isAIExpanded ? 'expanded' : 'collapsed'}`}>
          {!isAIExpanded ? (
            <div className="ai-evaluation-collapsed">
              <h4>AI 코드 평가</h4>
              <button
                onClick={() => {
                  setIsAIExpanded(true);
                  setTimeout(() => {
                    const evaluateBtn = document.querySelector('.evaluate-btn');
                    if (evaluateBtn) evaluateBtn.click();
                  }, 100);
                }}
                className="expand-ai-btn"
              >
                평가 시작하기
              </button>
            </div>
          ) : (
            <>
              <div className="ai-evaluation-header">
                <h4>코드 평가 결과</h4>
                <button onClick={() => setIsAIExpanded(false)} className="collapse-ai-btn">접기</button>
              </div>
              <AICodeEvaluation
                snippetId={snippetId}
                code={snippet.code}
                language={snippet.language}
                onEvaluationComplete={() => {}}
              />
            </>
          )}
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
              const finalAuthor = { ...comment.author, ...(authorProfiles[comment.author?.userId] || {}) };
              return (
                <div key={comment.commentId} className="comment-item">
                  <div className="comment-author">
                    <UserBadgeAndNickname user={finalAuthor} />
                  </div>

                  {editCommentId === comment.commentId ? (
                    <div className="comment-edit-form">
                      <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} />
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
                              <button onClick={() => { setEditCommentId(comment.commentId); setEditContent(comment.content); }}>
                                <FaEdit /> 수정
                              </button>
                              <button onClick={() => handleCommentDelete(comment.commentId)}><FaTrash /> 삭제</button>
                            </>
                          )}
                        </div>
                      </div>

                      {replyingToCommentId === comment.commentId && (
                        <div className="reply-form">
                          <form onSubmit={(e) => handleReplySubmit(e, comment.commentId)}>
                            <textarea
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              placeholder="답글을 입력하세요..."
                            />
                            <button type="submit">답글 작성</button>
                            <button type="button" onClick={() => { setReplyingToCommentId(null); setReplyContent(''); }}>취소</button>
                          </form>
                        </div>
                      )}

                      {comment.replies && comment.replies.length > 0 && (
                        <div className="replies-container">
                          {comment.replies.map((reply) => {
                            const finalReplyAuthor = { ...reply.author, ...(authorProfiles[reply.author?.userId] || {}) };
                            return (
                              <div
                                key={reply.commentId}
                                className="reply-item"
                                style={{ marginLeft: '20px', borderLeft: '2px solid #e0e0e0', paddingLeft: '10px' }}
                              >
                                <div className="comment-author">
                                  <UserBadgeAndNickname user={finalReplyAuthor} />
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
                            );
                          })}
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
          <div className="meta-row">
            <span className="meta-label">
              <FaUser style={{ marginRight: 6 }} />
              작성자
            </span>
            <div className="meta-value">
              <UserBadgeAndNickname user={{ ...snippet.author, ...(authorProfiles[snippet.author?.userId] || {}) }} />
            </div>
          </div>
        </div>

        <div className="sidebar-card info-card">
          <h4><FaCode /> 스니펫 정보</h4>
          <ul>
            <li><FaEye /> 조회수 {snippet.viewCount}</li>
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
