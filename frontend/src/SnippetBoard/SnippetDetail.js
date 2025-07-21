import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { solarizedlight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import copy from 'clipboard-copy';
import '../css/SnippetDetail.css';

const SnippetDetail = () => {
  const { snippetId } = useParams();
  const { user, getAuthHeaders } = useAuth();
  const navigate = useNavigate();

  const [snippet, setSnippet] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const fetchSnippetData = useCallback(async () => {
    try {
      const [snippetRes, commentsRes, likeRes] = await Promise.all([
        fetch(`/api/v1/snippets/${snippetId}`),
        fetch(`/api/v1/snippets/${snippetId}/comments`),
        fetch(`/api/v1/likes/snippets/${snippetId}/status`, { headers: getAuthHeaders() })
      ]);

      if (!snippetRes.ok) throw new Error('스니펫 정보를 불러올 수 없습니다.');
      const snippetData = await snippetRes.json();
      setSnippet(snippetData);
      setLikeCount(snippetData.likeCount);

      if (commentsRes.ok) {
        const commentsData = await commentsRes.json();
        setComments(commentsData.content || []);
      }

      if (likeRes.ok) {
        const likeData = await likeRes.json();
        setIsLiked(likeData.liked);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [snippetId, getAuthHeaders]);

  useEffect(() => {
    fetchSnippetData();
  }, [fetchSnippetData]);

  const handleCopyToClipboard = () => {
    copy(snippet.code).then(() => {
      alert('코드가 클립보드에 복사되었습니다!');
    });
  };

  const handleDelete = async () => {
    if (window.confirm('정말로 이 스니펫을 삭제하시겠습니까?')) {
      try {
        const response = await fetch(`/api/v1/snippets/${snippetId}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('삭제에 실패했습니다.');
        alert('스니펫이 삭제되었습니다.');
        navigate('/snippets');
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleLike = async () => {
    if (!user) return alert('로그인이 필요합니다.');
    try {
      const response = await fetch(`/api/v1/likes/snippets/${snippetId}`, {
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

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const response = await fetch(`/api/v1/snippets/${snippetId}/comments`, {
        method: 'POST',
        headers: getAuthHeaders({'Content-Type': 'application/json'}),
        body: JSON.stringify({ content: newComment }),
      });
      if (!response.ok) throw new Error('댓글 작성 실패');
      setNewComment('');
      fetchSnippetData(); // Re-fetch all data to show new comment
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="text-center py-5"><div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div></div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!snippet) return <div className="alert alert-warning">스니펫을 찾을 수 없습니다.</div>;

  const isAuthor = user?.id === snippet.author?.userId;

  return (
    <div className="container snippet-detail-container">
      <div className="snippet-header">
        <h1>{snippet.title}</h1>
        <div className="d-flex justify-content-between align-items-center snippet-meta">
          <div>
            <span className="author">by {snippet.author?.nickname}</span>
            <span className="mx-2">|</span>
            <span>{new Date(snippet.createdAt).toLocaleDateString()}</span>
          </div>
          {isAuthor && (
            <div className="snippet-actions">
              <Link to={`/snippets/edit/${snippetId}`} className="btn btn-outline-secondary btn-sm me-2">수정</Link>
              <button onClick={handleDelete} className="btn btn-outline-danger btn-sm">삭제</button>
            </div>
          )}
        </div>
      </div>

      <div className="row">
        <div className="col-lg-8">
          <h5 className="mb-3">코드</h5>
          <div className="code-container">
            <SyntaxHighlighter language={snippet.language?.toLowerCase()} style={solarizedlight} showLineNumbers>
              {snippet.code || ''}
            </SyntaxHighlighter>
            <button onClick={handleCopyToClipboard} className="btn btn-sm btn-light copy-button">
              <i className="bi bi-clipboard"></i> 복사
            </button>
          </div>

          <h5 className="mt-4 mb-3">설명</h5>
          <div className="card description-card">
            <div className="card-body">
              <p className="card-text">{snippet.description || '설명이 없습니다.'}</p>
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <h5 className="mb-3">정보</h5>
          <div className="card">
            <ul className="list-group list-group-flush">
              <li className="list-group-item d-flex justify-content-between align-items-center">
                언어
                <span className="badge bg-primary rounded-pill">{snippet.language}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                좋아요
                <span className="badge bg-primary rounded-pill d-flex align-items-center">
                  <button onClick={handleLike} className={`like-button ${isLiked ? 'liked' : ''}`}>
                    <i className={`bi ${isLiked ? 'bi-heart-fill' : 'bi-heart'}`}></i>
                  </button>
                  <span className="fw-bold">{likeCount}</span>
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="comment-section">
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
};

export default SnippetDetail;
