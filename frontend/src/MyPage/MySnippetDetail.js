import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function MySnippetDetail() {
  const { snippetId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [snippet, setSnippet] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // 스니펫 데이터 불러오기
  useEffect(() => {
    if (!token) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    fetch(`/api/v1/snippets/${snippetId}`, {
      headers: { Authorization: `Bearer ${token}` },
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
        console.error(err);
        alert(err.message);
        setLoading(false);
      });
  }, [snippetId, token, navigate]);

  // 입력값 변경 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSnippet((prev) => ({ ...prev, [name]: value }));
  };

  // 수정 제출 핸들러
  const handleSave = () => {
    fetch(`/api/v1/snippets/${snippetId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(snippet),
    })
      .then((res) => {
        if (!res.ok) throw new Error('수정 실패');
        alert('수정 완료');
        setEditMode(false);
      })
      .catch((err) => {
        console.error(err);
        alert('수정 중 오류 발생');
      });
  };

  // 삭제 핸들러
  const handleDelete = () => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    fetch(`/api/v1/snippets/${snippetId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('삭제 실패');
        alert('삭제 완료');
        navigate('/mypage/snippets');
      })
      .catch((err) => {
        console.error(err);
        alert('삭제 중 오류 발생');
      });
  };

  if (loading) return <p>로딩 중...</p>;
  if (!snippet) return <p>스니펫이 존재하지 않습니다.</p>;

  return (
    <div className="snippet-detail-container">
      <h2>💻 스니펫 상세</h2>

      {editMode ? (
        <div className="edit-form">
          <label>제목</label>
          <input type="text" name="title" value={snippet.title} onChange={handleChange} />

          <label>언어</label>
          <select name="language" value={snippet.language} onChange={handleChange}>
            <option value="">선택</option>
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="c">C</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
          </select>

          <label>내용</label>
          <textarea name="content" value={snippet.content} onChange={handleChange} rows={10} />

          <button onClick={handleSave} className="btn btn-success">저장</button>
          <button onClick={() => setEditMode(false)} className="btn btn-secondary" style={{ marginLeft: '10px' }}>취소</button>
        </div>
      ) : (
        <div className="snippet-display">
          <h3>{snippet.title}</h3>
          <p><strong>언어:</strong> {snippet.language}</p>
          <pre style={{ background: '#f8f8f8', padding: '10px' }}>{snippet.content}</pre>
          <small>{new Date(snippet.createdAt).toLocaleString()}</small>

          <div style={{ marginTop: '20px' }}>
            <button onClick={() => setEditMode(true)} className="btn btn-primary">수정</button>
            <button onClick={handleDelete} className="btn btn-danger" style={{ marginLeft: '10px' }}>삭제</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MySnippetDetail;
