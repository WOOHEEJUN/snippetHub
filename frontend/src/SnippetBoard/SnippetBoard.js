import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './SnippetBoard.css';

function SnippetBoard() {
  const navigate = useNavigate();
  const { user, getAuthHeaders } = useAuth();
  const [snippets, setSnippets] = useState([]);

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

  useEffect(() => {
    fetch('/api/v1/snippets', {
      headers: getAuthHeaders(),
    })
      .then(res => res.json())
      .then(data => {
        console.log("서버에서 받아온 스니펫 목록:", data);
        const snippetsData = Array.isArray(data) ? data : data.content || [];
        setSnippets(snippetsData);
      })
      .catch(err => {
        console.error('스니펫 로드 실패:', err);
      });
  }, []);

  return (
    <div className="container mt-5 snippet-board-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>💻 코드 스니펫</h2>
        <button className="btn btn-primary" onClick={handleWrite}>
          스니펫 작성
        </button>
      </div>

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
                key={snippet.snippetId}
                onClick={() => handleRowClick(snippet.snippetId)}
                className="snippet-row"
              >
                <td>{index + 1}</td>
                <td>
                  <div>
                    <strong>{snippet.title}</strong>
                    {snippet.description && (
                      <div className="text-muted small mt-1">
                        {snippet.description.length > 50 
                          ? snippet.description.substring(0, 50) + '...' 
                          : snippet.description}
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <span className="badge bg-secondary">
                    {snippet.language?.name || '기타'}
                  </span>
                </td>
                <td>{snippet.author?.nickname || '알 수 없음'}</td>
                <td>{new Date(snippet.createdAt).toLocaleDateString()}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default SnippetBoard;
