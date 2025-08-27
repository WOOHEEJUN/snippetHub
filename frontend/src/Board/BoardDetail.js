import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FaComment, FaEye, FaUser, FaCalendarAlt, FaEdit, FaTrash, FaThumbsUp, FaTag,
  FaHeart, FaRegHeart
} from 'react-icons/fa';

import '../css/BoardDetail.css';
import { getRepresentativeBadgeImage, getLevelBadgeImage } from '../utils/badgeUtils';

const MOCK_ENABLED = false;

const normalizeComments = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.content)) return payload.content;
  if (payload.data?.content && Array.isArray(payload.data.content)) return payload.data.content;
  return [];
};

// 레벨 배지 컴포넌트(숫자/영문/한글 level 모두 허용)
const LevelBadgeImg = ({ level, className = 'level-badge-inline' }) => {
  const src = getLevelBadgeImage(level);
  if (!src) return null;
  return (
    <img
      src={src}
      alt={typeof level === 'string' ? level : 'level-badge'}
      className={className}
    />
  );
};

function BoardDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // ✅ 누락됐던 상태 훅들 전부 선언
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [error, setError] = useState('');

  const [newComment, setNewComment] = useState('');

  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');

  const [replyContent, setReplyContent] = useState('');
  const [replyingToCommentId, setReplyingToCommentId] = useState(null);

  // 랭킹에서 받은 userId -> level 매핑
  const [authorLevels, setAuthorLevels] = useState({});

  const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchRankingData = useCallback(async () => {
    try {
      const res = await fetch(`/api/users/ranking?size=1000`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('랭킹 정보를 불러올 수 없습니다.');
      const data = await res.json();
      const levelMap = {};
      (data?.data?.content || []).forEach((u) => {
        levelMap[u.userId] = u.currentLevel;
      });
      setAuthorLevels(levelMap);
    } catch (err) {
      console.error('Failed to fetch ranking data:', err);
    }
  }, []);

  const fetchPostData = useCallback(async () => {
    try {
      const [postRes, commentsRes] = await Promise.all([
        fetch(`/api/posts/${postId}`, { headers: getAuthHeaders(), credentials: 'include' }),
        fetch(`/api/v1/posts/${postId}/comments/all`, { headers: getAuthHeaders(), credentials: 'include' }),
      ]);

      if (!postRes.ok) throw new Error('게시글 정보를 불러올 수 없습니다.');

      const postJson = await postRes.json().catch(() => null);
      setPost(postJson?.data ?? postJson ?? null);

      if (commentsRes.ok) {
        const commentsJson = await commentsRes.json().catch(() => null);
        setComments(normalizeComments(commentsJson));
      } else {
        setComments([]);
      }
    } catch (err) {
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    }
  }, [postId]);

  useEffect(() => {
    fetchPostData();
    fetchRankingData();
  }, [fetchPostData, fetchRankingData, postId]);

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
        credentials: 'include',
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`삭제 실패: ${res.status} - ${txt}`);
      }
      alert('삭제되었습니다.');
      navigate('/board');
    } catch (err) {
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
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || '좋아요 처리에 실패했습니다.');
      }

      const body = await res.json().catch(() => null);

      setPost(prev => ({
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

      const body = await res.json().catch(() => null);
      const created = body?.data ?? body ?? null;

      if (created) {
        setComments(prev => [...prev, created]);
      } else {
        fetchPostData();
      }
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

      const body = await res.json().catch(() => null);
      const updated = body?.data ?? body ?? null;

      if (updated) {
        setComments(prev =>
          prev.map(c =>
            c.commentId === commentId ? (updated || { ...c, content: editingCommentContent }) : c
          )
        );
      } else {
        fetchPostData();
      }
      setEditingCommentId(null);
      setEditingCommentContent('');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('정말 이 댓글을 삭제하시겠습니까?')) return;
    try {
      let res;
      if (MOCK_ENABLED) {
        setComments(prev => prev.filter(c => c.commentId !== commentId));
        res = { ok: true, status: 200 };
      } else {
        res = await fetch(`/api/v1/comments/${commentId}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
          credentials: 'include',
        });
      }
      if (!res.ok) throw new Error('댓글 삭제 실패');
      setComments(prev => prev.filter(c => c.commentId !== commentId));
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
          parentCommentId,
        }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('답글 작성 실패');

      await fetchPostData();
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

  if (error)
    return <div className="container text-center py-5 text-danger">{error}</div>;

  if (!post)
    return (
      <div className="container text-center py-5">
        <div className="spinner-border text-secondary" role="status"></div>
        <p className="mt-3">⏳ 게시글을 불러오는 중...</p>
      </div>
    );

  const isAuthor = user?.userId === post.author?.userId;

return (
  <div className="board-detail-page">
    {/* 본문 영역 */}
    <div className="post-main-content">
      <div className="post-header">
        <h1>{post.title}</h1>
        <div className="post-meta-info">
          <span className="category-info-inline">
            <FaTag /> {post.category}
          </span>

          <span className="author-info-inline">
            <FaUser />
            {(() => {
              const displayLevel =
                authorLevels[post.author?.userId] || post.author?.level;
              return post.author?.userId ? (
                <Link to={`/users/${post.author.userId}`} className="author-link">
                  {post.author?.representativeBadge ? (
                    <img src={getRepresentativeBadgeImage(post.author.representativeBadge)} alt={post.author.representativeBadge.name} className="level-badge-inline" style={{ marginRight: '4px' }} />
                  ) : (
                    displayLevel && <img src={getLevelBadgeImage(displayLevel)} alt={displayLevel} className="level-badge-inline" style={{ marginRight: '4px' }} />
                  )}
                  {post.author?.nickname}
                </Link>
              ) : (
                <>
                  {post.author?.representativeBadge ? (
                    <img src={getRepresentativeBadgeImage(post.author.representativeBadge)} alt={post.author.representativeBadge.name} className="level-badge-inline" style={{ marginRight: '4px' }} />
                  ) : (
                    displayLevel && <img src={getLevelBadgeImage(displayLevel)} alt={displayLevel} className="level-badge-inline" style={{ marginRight: '4px' }} />
                  )}
                  {post.author?.nickname}
                </>
              );
            })()}
          </span>

          <span className="date-info-inline">
            <FaCalendarAlt /> {new Date(post.createdAt).toLocaleDateString()}
          </span>
          <span className="view-info-inline">
            <FaEye /> {post.viewCount}
          </span>
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
          style={{
            background: 'none',
            border: 'none',
            outline: 'none',
            cursor: 'pointer',
            fontSize: 24,
            display: 'flex',
            alignItems: 'center',
            color: post.isLiked ? '#e74c3c' : '#aaa',
            transition: 'color 0.2s',
          }}
          aria-label={post.isLiked ? '좋아요 취소' : '좋아요'}
        >
          {post.isLiked ? (
            <FaHeart style={{ transition: 'transform 0.2s', transform: 'scale(1.2)' }} />
          ) : (
            <FaRegHeart />
          )}
          <span style={{ marginLeft: 8, fontWeight: 'bold', fontSize: 18 }}>
            {post.likeCount}
          </span>
        </button>
      </div>

      <div className="comment-section">
        <h3>
          <FaComment /> 댓글 ({comments.length})
        </h3>

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
            const authorId = comment.author?.userId ?? comment.authorId;
            const authorName =
              comment.author?.nickname ?? comment.authorNickname ?? '알 수 없는 사용자';

            return (
              <div key={comment.commentId} className="comment-item">
                <div className="comment-author">
                  {(() => {
                    const displayLevel =
                      authorLevels[authorId] || comment.author?.level;
                    return authorId ? (
                      <Link to={`/users/${authorId}`} className="author-link">
                        {comment.author?.representativeBadge ? (
                          <img src={getRepresentativeBadgeImage(comment.author.representativeBadge)} alt={comment.author.representativeBadge.name} className="level-badge-inline" style={{ marginRight: '4px' }} />
                        ) : (
                          displayLevel && <img src={getLevelBadgeImage(displayLevel)} alt={displayLevel} className="level-badge-inline" style={{ marginRight: '4px' }} />
                        )}
                        {authorName}
                      </Link>
                    ) : (
                      <span className="author-link">
                        {displayLevel && (
                          <img
                            src={getLevelBadgeImage(displayLevel)}
                            alt={displayLevel}
                            className="level-badge-inline"
                          />
                        )}
                        {authorName}
                      </span>
                    );
                  })()}
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
                        <button onClick={() => setReplyingToCommentId(comment.commentId)}>
                          답글
                        </button>
                        {user?.userId === authorId && (
                          <>
                            <button onClick={() => handleEditComment(comment)}>
                              <FaEdit /> 수정
                            </button>
                            <button onClick={() => handleDeleteComment(comment.commentId)}>
                              <FaTrash /> 삭제
                            </button>
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
                          <button type="button" onClick={handleCancelReply}>
                            취소
                          </button>
                        </form>
                      </div>
                    )}

                    {comment.replies && comment.replies.length > 0 && (
                      <div className="replies-container">
                        {comment.replies.map((reply) => {
                          const rAuthorId = reply.author?.userId ?? reply.authorId;
                          const rAuthorName =
                            reply.author?.nickname ?? reply.authorNickname ?? '알 수 없는 사용자';

                          return (
                            <div
                              key={reply.commentId}
                              className="reply-item"
                              style={{
                                marginLeft: '20px',
                                borderLeft: '2px solid #e0e0e0',
                                paddingLeft: '10px',
                              }}
                            >
                              <div className="comment-author">
                                {(() => {
                                  const displayLevel =
                                    authorLevels[rAuthorId] || reply.author?.level;
                                  return rAuthorId ? (
                                    <Link to={`/users/${rAuthorId}`} className="author-link">
                                      {reply.author?.representativeBadge ? (
                                        <img src={getRepresentativeBadgeImage(reply.author.representativeBadge)} alt={reply.author.representativeBadge.name} className="level-badge-inline" style={{ marginRight: '4px' }} />
                                      ) : (
                                        displayLevel && <img src={getLevelBadgeImage(displayLevel)} alt={displayLevel} className="level-badge-inline" style={{ marginRight: '4px' }} />
                                      )}
                                      {rAuthorName}
                                    </Link>
                                  ) : (
                                    <span className="author-link">
                                      {displayLevel && (
                                        <img
                                          src={getLevelBadgeImage(displayLevel)}
                                          alt={displayLevel}
                                          className="level-badge-inline"
                                        />
                                      )}
                                      {rAuthorName}
                                    </span>
                                  );
                                })()}
                              </div>

                              <p className="comment-content">{reply.content}</p>
                              <div className="comment-meta">
                                <span>{new Date(reply.createdAt).toLocaleString()}</span>
                                {user?.userId === rAuthorId && (
                                  <div className="comment-actions">
                                    <button onClick={() => handleDeleteComment(reply.commentId)}>
                                      <FaTrash /> 삭제
                                    </button>
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

    </div> {/* post-main-content 종료 */}

    {/* 🔒 사이드바는 반드시 post-sidebar 안에 */}
    <aside className="post-sidebar">
      <div className="sidebar-card author-card">
        <h4><FaUser /> 작성자</h4>
        <div className="author-info">
          {(() => {
            const displayLevel =
              authorLevels[post.author?.userId] || post.author?.level;
            return post.author?.userId ? (
              <Link to={`/users/${post.author.userId}`} className="author-link">
                {displayLevel && (
                  <img
                    src={getLevelBadgeImage(displayLevel)}
                    alt={displayLevel}
                    className="level-badge-inline"
                  />
                )}
                <span className="nickname">{post.author?.nickname}</span>
              </Link>
            ) : (
              <>
                {displayLevel && (
                  <img
                    src={getLevelBadgeImage(displayLevel)}
                    alt={displayLevel}
                    className="level-badge-inline"
                  />
                )}
                <span className="nickname">{post.author?.nickname}</span>
              </>
            );
          })()}
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
            <button onClick={handleEdit} className="action-button edit-button">
              <FaEdit /> 수정하기
            </button>
            <button onClick={handleDelete} className="action-button delete-button">
              <FaTrash /> 삭제하기
            </button>
          </>
        )}
        <button onClick={() => navigate('/board')} className="action-button back-button">
          목록으로
        </button>
      </div>
    </aside>
  </div>
);
}
export default BoardDetail;
