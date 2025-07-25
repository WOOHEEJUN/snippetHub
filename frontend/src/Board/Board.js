import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../css/Board.css';

const Board = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('LATEST');
  const [selectedCategory, setSelectedCategory] = useState(''); // 카테고리 상태 추가

  const fetchPosts = (page = 0, term = '', sort = 'LATEST', category = '') => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      page,
      size: 10,
      sort,
    });
    if (term) {
      params.append('search', term);
    }
    if (category) {
      params.append('category', category);
    }

fetch(`/api/posts?${params.toString()}`)
  .then(res => {
    if (!res.ok) throw new Error('게시글을 불러오는 데 실패했습니다.');
    return res.json();
  })
  .then(result => {
    const { content, currentPage, totalPages } = result.data;
    setPosts(content || []);
    setCurrentPage(currentPage);
    setTotalPages(totalPages);
  })
  .catch(err => {
    setError(err.message);
    console.error('게시글 로드 실패:', err);
  })
  .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPosts(0, searchTerm, sortOrder, selectedCategory);
  }, [searchTerm, sortOrder, selectedCategory]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPosts(0, searchTerm, sortOrder, selectedCategory);
  };

  const handleWrite = () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      navigate('/login');
    } else {
      navigate('/board/write');
    }
  };

  return (
    <div className="container board-container">
      <div className="board-header">
        <h2>자유 게시판</h2>
        <p className="text-muted">다양한 주제에 대해 자유롭게 이야기를 나눠보세요.</p>
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
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
          >
            <option value="">모든 카테고리</option>
            <option value="GENERAL">일반</option>
            <option value="QNA">Q&A</option>
            <option value="INFO">정보</option>
          </select>
          <select 
            className="form-select" 
            style={{width: '150px'}}
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
          >
            <option value="LATEST">최신순</option>
            <option value="POPULAR">인기순</option>
          </select>
          <button className="btn btn-outline-secondary" type="submit">검색</button>
        </form>
        <button className="btn btn-primary" onClick={handleWrite}>글쓰기</button>
      </div>

      {loading && <div className="text-center"><div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div></div>}
      {error && <div className="alert alert-danger">{error}</div>}
      
      {!loading && !error && (
        <>
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th style={{width: '10%'}}>번호</th>
                <th style={{width: '10%'}}>카테고리</th>
                <th style={{width: '40%'}}>제목</th>
                <th style={{width: '15%'}}>작성자</th>
                <th style={{width: '15%'}}>작성일</th>
              </tr>
            </thead>
            <tbody>
              {posts.length > 0 ? (
                posts.map((post) => (
                  <tr key={post.postId} onClick={() => navigate(`/board/${post.postId}`)} style={{ cursor: 'pointer' }}>
                    <td>{post.postId}</td>
                    <td>{post.category}</td>
                    <td>
                      <Link to={`/board/${post.postId}`} className="post-title">
                        {post.title}
                      </Link>
                    </td>
                    <td>{post.author?.nickname || '-'}</td>
                    <td>{new Date(post.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-5 text-muted">
                    <h5>게시글이 없습니다.</h5>
                    <p>첫 번째 게시글을 작성해보세요!</p>
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
                    <button className="page-link" onClick={() => fetchPosts(page, searchTerm, sortOrder)}>{page + 1}</button>
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
