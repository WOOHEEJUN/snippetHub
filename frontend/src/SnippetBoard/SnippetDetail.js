import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // 🔄 스니펫 정보만 불러오는 함수
  const fetchSnippetData = useCallback(async () => {
    try {
      const snippetRes = await fetch(`/api/snippets/${snippetId}`);
      if (!snippetRes.ok) throw new Error('스니펫 정보를 불러올 수 없습니다.');
      const snippetJson = await snippetRes.json();
      setSnippet(snippetJson.data);
      setLikeCount(Number(snippetJson.data.likeCount) || 0);
      setIsLiked(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [snippetId]);

  // 🔄 댓글만 불러오는 함수
  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/snippets/${snippetId}/comments`);
      const json = await res.json();
      setComments(json.data || []);
    } catch (err) {
      console.error('댓글 불러오기 실패:', err);
    }
  }, [snippetId]);

  useEffect(() => {
    fetchSnippetData();
    fetchComments();
  }, [fetchSnippetData, fetchComments]);

  const handleCopyToClipboard = () => {
    if (snippet?.code) {
      copy(snippet.code).then(() => {
        alert('코드가 클립보드에 복사되었습니다!');
      });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('정말로 이 스니펫을 삭제하시겠습니까?')) return;
    try {
      const response = await fetch(`/api/snippets/${snippetId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('삭제에 실패했습니다.');
      alert('스니펫이 삭제되었습니다.');
      navigate('/snippets');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLike = async () => {
    if (!user) return alert('로그인이 필요합니다.');
    try {
      const response = await fetch(`/api/snippets/${snippetId}/like`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('요청 실패');
      const result = await response.json();
      setIsLiked(result.data);
      setLikeCount((prev) => result.data ? prev + 1 : prev - 1);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const response = await fetch(`/api/snippets/${snippetId}/comments`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment }),
      });
      if (!response.ok) throw new Error('댓글 작성 실패');
      setNewComment('');
      fetchComments();
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
    if (!editingCommentContent.trim()) return alert('댓글 내용을 입력해주세요.');
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
      fetchComments();
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
      fetchComments();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="text-center py-5">로딩 중...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!snippet) return <div className="alert alert-warning">스니펫을 찾을 수 없습니다.</div>;

  const isAuthor = Number(user?.userId) === Number(snippet.author?.userId);

  return (
    <div className="container snippet-detail-container">
      <h2 className="post-title mb-3">{snippet.title || '제목 없음'}</h2>

      <div className="post-meta d-flex justify-content-between align-items-center mb-4 text-muted">
        <span className="post-author">작성자: {snippet.author?.nickname || '알 수 없음'}</span>
        <span className="post-date">
          작성일: {snippet.createdAt ? new Date(snippet.createdAt).toLocaleString() : '작성일 정보 없음'}
        </span>
        {isAuthor && (
          <div className="snippet-actions">
            <button onClick={() => navigate(`/snippets/edit/${snippetId}`)} className="btn btn-outline-secondary btn-sm me-2">수정</button>
            <button onClick={handleDelete} className="btn btn-outline-danger btn-sm">삭제</button>
          </div>
        )}
      </div>

      <div className="row">
        <div className="col-lg-8">
          <h5 className="mb-3">코드</h5>
          <div className="code-container">
            <SyntaxHighlighter language={snippet.language?.toLowerCase() || 'text'} style={solarizedlight} showLineNumbers>
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
                <span className="badge bg-primary rounded-pill">{snippet.language || '알 수 없음'}</span>
              </li>
            </ul>
          </div>

          <div className="d-flex justify-content-center align-items-center gap-3 my-4">
            <button className="btn btn-secondary px-4" onClick={() => navigate(-1)}>← 목록으로 돌아가기</button>
            <div className="like-section">
              <button onClick={handleLike} className={`like-button ${isLiked ? 'liked' : ''}`}>
                <i className={`bi ${isLiked ? 'bi-heart-fill' : 'bi-heart'}`}></i>
              </button>
              <span className="like-count">{likeCount}</span>
            </div>
          </div>

          <div className="comment-section mt-4">
            <h4 className="mb-4">댓글 ({comments.length})</h4>
            {user && (
              <form onSubmit={handleCommentSubmit} className="mb-4">
                <div className="input-group">
                  <textarea
                    className="form-control comment-form-textarea"
                    rows="3"
                    placeholder="댓글을 입력하세요..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
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
                        <span className="comment-author">{comment.author?.nickname || '익명'}</span>
                        <span className="comment-date">{comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ''}</span>
                      </div>
                      <p className="mt-2 mb-0">{comment.content}</p>
                      {user?.nickname === comment.author?.nickname && (
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
      </div>
    </div>
  );
};

export default SnippetDetail;
