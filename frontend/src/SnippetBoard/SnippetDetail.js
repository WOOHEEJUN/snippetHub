import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../css/SnippetDetail.css';

function SnippetDetail() {
  const { snippetId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [snippet, setSnippet] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editCommentId, setEditCommentId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    fetch(`/api/snippets/${snippetId}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error('스니펫 불러오기 실패');
        return res.json();
      })
      .then((data) => {
        setSnippet(data.data);
      })
      .catch((err) => {
        console.error(err);
        setError('스니펫을 불러오는 중 오류가 발생했습니다.');
      })
      .finally(() => setLoading(false));
  }, [snippetId, token]);

  useEffect(() => {
    fetch(`/api/snippets/${snippetId}/comments`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((res) => res.json())
      .then((data) => {
        setComments(Array.isArray(data.data) ? data.data : []);
      })
      .catch((err) => console.error('댓글 불러오기 실패:', err));
  }, [snippetId, token]);

  const handleEdit = () => {
    navigate(`/snippets/edit/${snippetId}`);
  };

  const handleDelete = async () => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/snippets/${snippetId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('삭제 실패');

      alert('삭제되었습니다.');
      navigate('/snippets');
    } catch (err) {
      console.error(err);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await fetch(`/api/snippets/${snippetId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: newComment })
      });
      if (!res.ok) throw new Error('댓글 작성 실패');
      const data = await res.json();
      setComments((prev) => [...prev, data.data]);
      setNewComment('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleCommentDelete = async (commentId) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;

    try {
      await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setComments((prev) => prev.filter((c) => c.commentId !== commentId));
    } catch (err) {
      console.error('댓글 삭제 실패:', err);
    }
  };

  const handleCommentEdit = async (commentId) => {
    if (!editContent.trim()) return;

    try {
      await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: editContent })
      });
      setComments((prev) =>
        prev.map((c) =>
          c.commentId === commentId ? { ...c, content: editContent } : c
        )
      );
      setEditCommentId(null);
      setEditContent('');
    } catch (err) {
      console.error('댓글 수정 실패:', err);
    }
  };

  const handleLike = async () => {
    try {
      const res = await fetch(`/api/snippets/${snippetId}/like`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('좋아요 실패');
      setSnippet((prev) => ({ ...prev, likeCount: prev.likeCount + 1 }));
    } catch (err) {
      console.error('좋아요 실패:', err);
    }
  };

  if (loading) return <p>로딩 중...</p>;
  if (error) return <p>{error}</p>;
  if (!snippet) return <p>스니펫이 존재하지 않습니다.</p>;

  return (
    <div className="snippet-detail-container">
      <h2>{snippet.title}</h2>
      <div className="snippet-meta">
        <span>작성자: {snippet.author?.nickname}</span>
        <span>작성일: {new Date(snippet.createdAt).toLocaleString()}</span>
      </div>

      <pre className="code-block">
        <code>{snippet.code}</code>
      </pre>

      <p className="description">{snippet.description}</p>

      <div className="snippet-actions">
        <button onClick={() => navigate('/snippets')} className="btn btn-secondary">← 목록으로 돌아가기</button>
        {user?.userId === snippet.author?.userId && (
          <>
            <button onClick={handleEdit} className="btn btn-outline-primary ms-2">수정</button>
            <button onClick={handleDelete} className="btn btn-outline-danger ms-2">삭제</button>
          </>
        )}
      </div>

      <div className="like-section mt-3">
        <button onClick={handleLike} className="btn btn-light">
          ❤️ {snippet.likeCount}
        </button>
      </div>

      <div className="comment-section mt-4">
        <h3>댓글 ({comments.length})</h3>
        <form onSubmit={handleCommentSubmit} className="comment-form">
          <textarea
            className="form-control"
            rows="3"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="댓글을 입력하세요..."
          ></textarea>
          <button type="submit" className="btn btn-primary mt-2">등록</button>
        </form>

        <div className="comment-list mt-4">
          {comments.map((comment) => (
            <div key={comment.commentId} className="comment bg-light p-3 rounded mb-2">
              <div className="fw-bold">{comment.author.nickname}</div>
              <div className="text-muted small">{new Date(comment.createdAt).toLocaleString()}</div>
              {editCommentId === comment.commentId ? (
                <>
                  <textarea
                    className="form-control mt-1"
                    rows="2"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                  ></textarea>
                  <button
                    className="btn btn-sm btn-success mt-1 me-2"
                    onClick={() => handleCommentEdit(comment.commentId)}
                  >저장</button>
                  <button
                    className="btn btn-sm btn-secondary mt-1"
                    onClick={() => setEditCommentId(null)}
                  >취소</button>
                </>
              ) : (
                <>
                  <p>{comment.content}</p>
                  {user?.userId === comment.author.userId && (
                    <div className="comment-actions">
                      <button
                        className="btn btn-sm btn-outline-secondary me-2"
                        onClick={() => {
                          setEditCommentId(comment.commentId);
                          setEditContent(comment.content);
                        }}
                      >수정</button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleCommentDelete(comment.commentId)}
                      >삭제</button>
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

export default SnippetDetail;
