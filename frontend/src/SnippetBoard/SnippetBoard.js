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
  const [sortOrder, setSortOrder] = useState('LATEST');

  // 데이터 요청 및 상태 업데이트
  const fetchSnippets = (page = 0, term = '', lang = '', sort = 'LATEST') => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      page,
      size: 10,
      sort,
    });
    if (term) params.append('search', term);
    if (lang) params.append('language', lang);

    fetch(`http://localhost:8080/api/snippets?${params.toString()}`)
      .then(res => {
        if (!res.ok) throw new Error('데이터를 불러오는 데 실패했습니다.');
        return res.json();
      })
      .then(data => {
        const pageData = data.data;
        setSnippets(pageData.content || []);
        setCurrentPage(pageData.currentPage);
        setTotalPages(pageData.totalPages);
      })
      .catch(err => {
        setError(err.message);
        console.error('스니펫 로드 실패:', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // URL 파라미터 가져오기
    const params = new URLSearchParams(location.search);
    const term = params.get('search') || '';
    const lang = params.get('language') || '';
    const sort = params.get('sort') || 'LATEST';
    const page = parseInt(params.get('page') || '0');

    // 상태 업데이트
    setSearchTerm(term);
    setSearchLanguage(lang);
    setSortOrder(sort);

    // 데이터 로드
    fetchSnippets(page, term, lang, sort);
  }, [location.search]);

  const handleSearch = (e) => {
    e.preventDefault();

    // URL 파라미터 설정
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (searchLanguage) params.set('language', searchLanguage);
    if (sortOrder) params.set('sort', sortOrder);
    params.set('page', 0); // 검색 시 첫 페이지로

    // 페이지 이동
    navigate(`/snippets?${params.toString()}`);
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
        <h2 className="mb-3">스니펫</h2>
        <p className="text-muted">다양한 코드 스니펫을 탐색하고 공유하세요.</p>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <form className="d-flex search-form" onSubmit={handleSearch}>
          <input 
            type="text" 
            className="form-control" 
            placeholder="검색..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <select 
            className="form-select" 
            style={{ width: '150px' }}
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
          <select 
            className="form-select" 
            style={{ width: '150px' }}
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
          >
            <option value="LATEST">최신순</option>
            <option value="POPULAR">인기순</option>
          </select>
          <button className="btn btn-outline-secondary" type="submit">검색</button>
        </form>
        <button className="btn btn-primary" onClick={handleWrite}>스니펫 작성</button>
      </div>

      {loading && (
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
      {error && <div className="alert alert-danger">{error}</div>}
      
      {!loading && !error && (
        <>
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th scope="col" style={{ width: '10%' }}>번호</th>
                <th scope="col" style={{ width: '40%' }}>제목</th>
                <th scope="col" style={{ width: '15%' }}>언어</th>
                <th scope="col" style={{ width: '15%' }}>작성자</th>
                <th scope="col" style={{ width: '20%' }}>작성일</th>
              </tr>
            </thead>
            <tbody>
              {snippets.length > 0 ? (
                snippets.map((snippet) => (
                  <tr key={snippet.snippetId} onClick={() => navigate(`/snippets/${snippet.snippetId}`)} style={{ cursor: 'pointer' }}>
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
                    <button
                      className="page-link"
                      onClick={() => {
                        const params = new URLSearchParams();
                        if (searchTerm) params.set('search', searchTerm);
                        if (searchLanguage) params.set('language', searchLanguage);
                        if (sortOrder) params.set('sort', sortOrder);
                        params.set('page', page);
                        navigate(`/snippets?${params.toString()}`);
                      }}
                    >
                      {page + 1}
                    </button>
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
