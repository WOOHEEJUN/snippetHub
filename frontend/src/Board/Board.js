// frontend/src/Board/Board.js
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// import { getLevelBadgeImage } from '../utils/badgeUtils'; // Removed
import UserBadgeAndNickname from '../components/UserBadgeAndNickname'; // Added

import '../css/Board.css';

const Board = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('LATEST');
  const [selectedCategory, setSelectedCategory] = useState('');

  const fetchPosts = useCallback((page = 0, term = '', sort = 'LATEST', category = '') => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ page, size: 10, sort });
    if (term) params.append('search', term);
    if (category) params.append('category', category);

    fetch(`/api/posts?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error('게시글을 불러오는 데 실패했습니다.');
        return res.json();
      })
      .then((result) => {
        const { content, currentPage, totalPages } = result.data || {};
        setPosts(content || []);
        setCurrentPage(currentPage ?? 0);
        setTotalPages(totalPages ?? 1);
      })
      .catch((err) => {
        setError(err.message);
        setPosts([]); // 오류 시 빈 배열
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const page = parseInt(params.get('page') || '0', 10);
    const term = params.get('search') || '';
    const sort = params.get('sort') || 'LATEST';
    const category = params.get('category') || '';

    setSearchTerm(term);
    setSortOrder(sort);
    setSelectedCategory(category);
    
    fetchPosts(page, term, sort, category);
  }, [location.search, fetchPosts]);

  const handleNavigation = (newParams) => {
    const params = new URLSearchParams(location.search);
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    navigate({ search: params.toString() });
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    handleNavigation({ search: searchTerm, page: 0 });
  };

  const handleWrite = () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      navigate('/login');
    } else {
      navigate('/board/write');
    }
  };

  const renderCategory = (cat) => {
    const map = { GENERAL: '자유', QNA: 'Q&A', INFO: '정보' };
    return map[cat] || cat || '-';
  };

  return (
    <div className="container board-container">
      <div className="board-header">
        <h2>자유 게시판</h2>
        <p className="text-muted">다양한 주제에 대해 자유롭게 이야기를 나눠보세요.</p>
      </div>

      {/* 툴바: 검색 + 글쓰기 */}
      <div className="d-flex justify-content-between align-items-center mb-4 board-toolbar-wrap">
        <form className="d-flex search-form" onSubmit={handleSearch}>
          <input
            type="text"
            className="form-control"
            placeholder="제목 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            className="form-select"
            value={selectedCategory}
            onChange={(e) => handleNavigation({ category: e.target.value, page: 0 })}
          >
            <option value="">모든 카테고리</option>
            <option value="GENERAL">자유</option>
            <option value="QNA">Q&A</option>
            <option value="INFO">정보</option>
          </select>

          <select
            className="form-select"
            value={sortOrder}
            onChange={(e) => handleNavigation({ sort: e.target.value, page: 0 })}
          >
            <option value="LATEST">최신순</option>
            <option value="POPULAR">인기순</option>
          </select>

          <button className="btn btn-search" type="submit">검색</button>
        </form>

        <button className="btn btn-write" onClick={handleWrite}>글쓰기</button>
      </div>

      {/* 로딩/에러 */}
      {loading && (
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* 게시글 목록 */}
      {!loading && (
        <>
          <table className="table table-hover align-middle board-table">
            <thead className="table-light">
              <tr>
                <th style={{ width: '10%' }}>번호</th>
                <th style={{ width: '12%' }}>카테고리</th>
                <th style={{ width: '43%' }}>제목</th>
                <th style={{ width: '15%' }}>작성자</th>
                <th style={{ width: '20%' }}>작성일</th>
              </tr>
            </thead>
            <tbody>
              {posts.length > 0 ? (
                posts.map((post) => (
                  <tr
                    key={post.postId}
                    onClick={() => navigate(`/board/${post.postId}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{post.postId}</td>
                    <td>{renderCategory(post.category)}</td>
                    <td>
                      <Link to={`/board/${post.postId}`} className="post-title ellipsis-1">
                        {post.title}
                      </Link>
                    </td>
                    <td>
                      {/* Replaced with UserBadgeAndNickname */}
                      <UserBadgeAndNickname user={post.author} />
                    </td>
                    <td>{new Date(post.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-5 text-muted empty-board-message">
                    <h5>게시글이 없습니다.</h5>
                    <p>첫 번째 게시글을 작성해보세요!</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <nav className="d-flex justify-content-center">
              <ul className="pagination">
                {[...Array(totalPages).keys()].map((page) => (
                  <li
                    key={page}
                    className={`page-item ${currentPage === page ? 'active' : ''}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => handleNavigation({ page })}
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

export default Board;
