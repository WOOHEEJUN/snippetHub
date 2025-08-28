import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FaComment, FaEye, FaUser, FaCalendarAlt, FaEdit, FaTrash, FaThumbsUp, FaTag,
  FaHeart, FaRegHeart
} from 'react-icons/fa';

import '../css/BoardDetail.css';
// import { getRepresentativeBadgeImage, getLevelBadgeImage } from '../utils/badgeUtils'; // Removed
import UserBadgeAndNickname from '../components/UserBadgeAndNickname'; // Added

const MOCK_ENABLED = false;

const normalizeComments = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.content)) return payload.content;
  if (payload.data?.content && Array.isArray(payload.data.content)) return payload.data.content;
  return [];
};

// LevelBadgeImg component removed

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

  const fetchPostData = useCallback(async () => {
    try {
      const [postRes, commentsRes] = await Promise.all([
        fetch(`/api/posts/${postId}`, { headers: getAuthHeaders(), credentials: 'include' }),
        fetch(`/api/v1/posts/${postId}/comments/all`, { headers: getAuthHeaders(), credentials: 'include' }),
      ]);

      if (!postRes.ok) throw new Error('게시글 정보를 불러올 수 없습니다.');

      const postJson = await postRes.json().catch(() => null);
      let fetchedPost = postJson?.data ?? postJson ?? null;

      // Fetch representative badge for post author
      if (fetchedPost && fetchedPost.author && fetchedPost.author.userId) {
        try {
          const badgeRes = await fetch(`/api/badges/users/${fetchedPost.author.userId}/featured`, {
            credentials: 'include',
          });
          if (badgeRes.ok) {
            const badgeData = await badgeRes.json();
            if (badgeData?.data?.length) {
              fetchedPost = {
                ...fetchedPost,
                author: {
                  ...fetchedPost.author,
                  representativeBadge: badgeData.data[0],
                },
              };
            }
          }
        } catch (badgeErr) {
          console.error(`Failed to fetch badge for post author ${fetchedPost.author.userId}:`, badgeErr);
        }
      }

      setPost(fetchedPost);

      if (commentsRes.ok) {
        const commentsJson = await commentsRes.json().catch(() => null);
        let fetchedComments = normalizeComments(commentsJson);

        // Fetch representative badges for comment authors
        fetchedComments = await Promise.all(
          fetchedComments.map(async (comment) => {
            if (comment.author && comment.author.userId) {
              try {
                const badgeRes = await fetch(`/api/badges/users/${comment.author.userId}/featured`, {
                  credentials: 'include',
                });
                if (badgeRes.ok) {
                  const badgeData = await badgeRes.json();
                  if (badgeData?.data?.length) {
                    return {
                      ...comment,
                      author: {
                        ...comment.author,
                        representativeBadge: badgeData.data[0],
                      },
                    };
                  }
                }
              } catch (badgeErr) {
                console.error(`Failed to fetch badge for comment author ${comment.author.userId}:`, badgeErr);
              }
            }
            return comment;
          })
        );
        setComments(fetchedComments);
      } else {
        setComments([]);
      }
    } catch (err) {
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
        fetchUserProfiles(); // 새 댓글 작성자 정보 로드
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
            {/* Replaced with UserBadgeAndNickname */}
            <UserBadgeAndNickname user={post.author} />
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
                  {/* Replaced with UserBadgeAndNickname */}
                  <UserBadgeAndNickname user={comment.author} />
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
                                {/* Replaced with UserBadgeAndNickname */}
                                <UserBadgeAndNickname user={reply.author} />
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
          <UserBadgeAndNickname user={{ ...post.author, ...(authorProfiles[post.author?.userId] || {}) }} />
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