import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../css/SnippetBoard.css';

const SnippetBoard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLanguage, setSearchLanguage] = useState('');

  const fetchSnippets = (page = 0, term = '', lang = '') => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      page,
      size: 10,
      sort: 'createdAt,desc',
      title: term,
      language: lang,
    });

    fetch(`/api/snippets?${params.toString()}`)
      .then(res => {
        if (!res.ok) throw new Error('데이터를 불러오는 데 실패했습니다.');
        return res.json();
      })
      .then(data => {
        setSnippets(data.content || []);
        setCurrentPage(data.number);
        setTotalPages(data.totalPages);
      })
      .catch(err => {
        setError(err.message);
        console.error('스니펫 로드 실패:', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const term = params.get('search') || '';
    const lang = params.get('language') || '';
    setSearchTerm(term);
    setSearchLanguage(lang);
    fetchSnippets(0, term, lang);
  }, [location.search]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchSnippets(0, searchTerm, searchLanguage);
  };

  const handleWrite = () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      navigate('/login');
    } else {
      navigate('/snippets/write');
    }
  };

  const getLanguageBadgeClass = (language) => {
    const lang = language?.toLowerCase() || 'default';
    return `language-badge-board badge-${lang}`;
  };

  return (
    <div className="container snippet-board-container">
      <div className="board-header">
        <h2 className="mb-3">스니펫 라이브러리</h2>
        <p className="text-muted">다양한 코드 스니펫을 탐색하고 공유하세요.</p>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <form className="d-flex search-form" onSubmit={handleSearch}>
          <input 
            type="text" 
            className="form-control" 
            placeholder="제목 검색..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <select 
            className="form-select" 
            style={{width: '150px'}}
            value={searchLanguage}
            onChange={e => setSearchLanguage(e.target.value)}
          >
            <option value="">모든 언어</option>
            <option value="HTML">HTML</option>
            <option value="CSS">CSS</option>
            <option value="JAVASCRIPT">JavaScript</option>
            <option value="JAVA">Java</option>
            <option value="PYTHON">Python</option>
            <option value="C">C</option>
          </select>
          <button className="btn btn-outline-secondary" type="submit">검색</button>
        </form>
        <button className="btn btn-primary" onClick={handleWrite}>스니펫 작성</button>
      </div>

      {loading && <div className="text-center"><div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div></div>}
      {error && <div className="alert alert-danger">{error}</div>}
      
      {!loading && !error && (
        <>
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th scope="col" style={{width: '10%'}}>번호</th>
                <th scope="col" style={{width: '40%'}}>제목</th>
                <th scope="col" style={{width: '15%'}}>언어</th>
                <th scope="col" style={{width: '15%'}}>작성자</th>
                <th scope="col" style={{width: '20%'}}>작성일</th>
              </tr>
            </thead>
            <tbody>
              {snippets.length > 0 ? (
                snippets.map((snippet, index) => (
                  <tr key={snippet.snippetId} onClick={() => navigate(`/snippets/${snippet.snippetId}`)}>
                    <td>{snippet.snippetId}</td>
                    <td>{snippet.title}</td>
                    <td><span className={getLanguageBadgeClass(snippet.language)}>{snippet.language}</span></td>
                    <td>{snippet.author?.nickname || '-'}</td>
                    <td>{new Date(snippet.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-5 text-muted">
                    <h5>검색 결과가 없습니다.</h5>
                    <p>다른 키워드로 검색해보시거나, 첫 스니펫을 작성해보세요!</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <nav className="d-flex justify-content-center">
              <ul className="pagination">
                {[...Array(totalPages).keys()].map(page => (
                  <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => fetchSnippets(page, searchTerm, searchLanguage)}>{page + 1}</button>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </>
      )}
    </div>
  );
};

export default SnippetBoard;
