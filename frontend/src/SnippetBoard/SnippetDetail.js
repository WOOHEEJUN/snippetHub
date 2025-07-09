import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../css/SnippetDetail.css'; // CSS 경로를 BoardDetail.css → SnippetDetail.css 로 명확히 분리

function SnippetDetail() {
  const { snippetId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [snippet, setSnippet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');

    fetch(`/api/v1/snippets/${snippetId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('스니펫 불러오기 실패');
        return res.json();
      })
      .then((data) => {
        setSnippet(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('에러:', err);
        setLoading(false);
      });
  }, [snippetId]);

  const handleEdit = () => {
    navigate(`/snippets/edit/${snippetId}`);
  };

  const handleDelete = () => {
    if (!window.confirm('이 스니펫을 삭제하시겠습니까?')) return;

    const token = localStorage.getItem('token');
    fetch(`/api/v1/snippets/${snippetId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('삭제 실패');
        alert('삭제되었습니다.');
        navigate('/snippets');
      })
      .catch((err) => {
        console.error('삭제 오류:', err);
        alert('삭제 중 오류 발생');
      });
  };

  if (loading) {
    return <div className="snippet-detail-loading">💾 스니펫을 불러오는 중입니다...</div>;
  }

  if (!snippet) {
    return <div className="snippet-detail-error">❌ 스니펫 정보를 찾을 수 없습니다.</div>;
  }

  const isAuthor = user?.nickname === snippet.author?.nickname;

  return (
    <div className="snippet-detail-container">
      <h2>{snippet.title}</h2>
      <p><strong>언어:</strong> {snippet.language?.toUpperCase()}</p>
      <p><strong>작성자:</strong> {snippet.author?.nickname}</p>
      <p><strong>작성일:</strong> {new Date(snippet.createdAt).toLocaleString()}</p>
      <p><strong>좋아요:</strong> {snippet.likes ?? 0}</p>

      {snippet.description && (
        <>
          <p><strong>설명:</strong></p>
          <div className="snippet-description">
            {snippet.description}
          </div>
        </>
      )}

      <hr />
      <div className="snippet-code-section">
        <h4>📄 코드</h4>
        <pre className="snippet-code">
          {snippet.content}
        </pre>
      </div>

      {isAuthor && (
        <div className="snippet-actions">
          <button className="btn btn-outline-primary me-2" onClick={handleEdit}>수정</button>
          <button className="btn btn-outline-danger" onClick={handleDelete}>삭제</button>
        </div>
      )}
    </div>
  );
}

export default SnippetDetail;
