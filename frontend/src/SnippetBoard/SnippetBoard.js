import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../css/Board.css'; // 자유게시판 스타일 재활용

function SnippetBoard() {
  const navigate = useNavigate();
  const { user, getAuthHeaders } = useAuth();
  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');

    fetch('/api/v1/snippets', {
      headers: getAuthHeaders(),
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`❌ 응답 실패: ${res.status}`);
        }

        const text = await res.text();
        if (!text) {
          console.warn('⚠️ 응답 본문이 없음');
          return [];
        }

        return JSON.parse(text);
      })
      .then((data) => {
        const snippetData = Array.isArray(data) ? data : data.content || [];
        setSnippets(snippetData);
      })
      .catch((err) => {
        console.error('스니펫 로드 실패:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleWrite = () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      navigate('/login');
    } else {
      navigate('/snippets/write');
    }
  };

  const handleRowClick = (snippetId) => {
    navigate(`/snippets/${snippetId}`);
  };

  return (
    <div className="container mt-5 board-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>💻 스니펫 게시판</h2>
        <button className="btn btn-primary" onClick={handleWrite}>
          스니펫 작성
        </button>
      </div>

      {loading ? (
        <p>불러오는 중...</p>
      ) : (
        <table className="table table-hover">
          <thead className="table-light">
            <tr>
              <th scope="col">번호</th>
              <th scope="col">제목</th>
              <th scope="col">언어</th>
              <th scope="col">작성자</th>
              <th scope="col">작성일</th>
            </tr>
          </thead>
          <tbody>
            {snippets.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center text-muted">
                  등록된 스니펫이 없습니다.
                </td>
              </tr>
            ) : (
              snippets.map((snippet, index) => (
                <tr
                  key={snippet.snippetId || `snippet-${index}`}
                  onClick={() => handleRowClick(snippet.snippetId)}
                >
                  <td>{index + 1}</td>
                  <td>{snippet.title}</td>
                  <td>{snippet.language?.toUpperCase() || '-'}</td>
                  <td>{snippet.author?.nickname || '알 수 없음'}</td>
                  <td>{new Date(snippet.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default SnippetBoard;
