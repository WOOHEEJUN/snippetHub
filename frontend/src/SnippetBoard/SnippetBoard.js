import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getLevelBadgeImage } from '../utils/badgeUtils';
import '../css/SnippetBoard.css';

const LANGUAGE_OPTIONS = ['C', 'Python', 'Java', 'JavaScript', 'CSS', 'HTML'];

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

  
  const fetchSnippets = useCallback((page = 0, term = '', lang = '', sort = 'LATEST') => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      page,
      size: 10,
      sort,
    });
    if (term) params.append('search', term);
    if (lang) params.append('language', lang);

    fetch(`/api/snippets?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error('데이터를 불러오는 데 실패했습니다.');
        return res.json();
      })
      .then((data) => {
        const pageData = data.data;
        setSnippets(pageData.content || []);
        setCurrentPage(pageData.currentPage);
        setTotalPages(pageData.totalPages);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const term = params.get('search') || '';
    const lang = params.get('language') || '';
    const sort = params.get('sort') || 'LATEST';
    const page = parseInt(params.get('page') || '0', 10);

    setSearchTerm(term);
    setSearchLanguage(lang);
    setSortOrder(sort);

    fetchSnippets(page, term, lang, sort);
  }, [location.search, fetchSnippets]);

  const handleSearch = (e) => {
    e.preventDefault();

    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (searchLanguage) params.set('language', searchLanguage);
    if (sortOrder) params.set('sort', sortOrder);
    params.set('page', 0); 

    navigate(`/snippets?${params.toString()}`);
  };

  const handleWrite = () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }
    navigate('/snippets/write');
  };

  const getLanguageBadgeClass = (language) => {
    const lang = language?.toLowerCase() || 'default';
    return `language-badge-board badge-${lang}`;
  };

  return (
    <div className="container snippet-board-container board-container">
      <div className="board-header">
        <h2 className="mb-3">스니펫</h2>
        <p className="text-muted">다양한 코드 스니펫을 탐색하고 공유하세요.</p>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            className="form-control"
            placeholder="검색어 입력"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            className="form-select"
            value={searchLanguage}
            onChange={(e) => setSearchLanguage(e.target.value)}
          >
            <option value="">모든 언어</option>
            {LANGUAGE_OPTIONS.map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>

          <select
            className="form-select"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="LATEST">최신순</option>
            <option value="POPULAR">인기순</option>
          </select>

          <button className="btn btn-dark" type="submit">
            검색
          </button>
        </form>

        <button className="btn btn-primary write-btn" onClick={handleWrite}>
          스니펫 작성
        </button>
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
                <th scope="col" style={{ width: '10%' }}>
                  번호
                </th>
                <th scope="col" style={{ width: '40%' }}>
                  제목
                </th>
                <th scope="col" style={{ width: '15%' }}>
                  언어
                </th>
                <th scope="col" style={{ width: '15%' }}>
                  작성자
                </th>
                <th scope="col" style={{ width: '20%' }}>
                  작성일
                </th>
              </tr>
            </thead>
            <tbody>
              {snippets.length > 0 ? (
                snippets.map((snippet) => (
                  <tr
                    key={snippet.snippetId}
                    onClick={() => navigate(`/snippets/${snippet.snippetId}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{snippet.snippetId}</td>
                    <td>{snippet.title}</td>
                    <td>
                      <span className={getLanguageBadgeClass(snippet.language)}>{snippet.language}</span>
                    </td>
                    <td>
                      {snippet.author?.userId ? (
                        <Link to={`/users/${snippet.author.userId}`}>
                          {snippet.author?.level && (
                            <img
                              src={getLevelBadgeImage(snippet.author.level)}
                              alt={snippet.author.level}
                              className="level-badge-inline"
                            />
                          )}
                          {snippet.author?.nickname || '-'}
                        </Link>
                      ) : (
                        <span>{snippet.author?.nickname || '-'}</span>
                      )}
                    </td>
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
                {[...Array(totalPages).keys()].map((page) => (
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