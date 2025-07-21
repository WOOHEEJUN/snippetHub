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

  const fetchPosts = (page = 0, term = '') => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      page,
      size: 10,
      sort: 'createdAt,desc',
      title: term,
    });

    fetch(`/api/posts?${params.toString()}`)
      .then(res => {
        if (!res.ok) throw new Error('게시글을 불러오는 데 실패했습니다.');
        return res.json();
      })
      .then(data => {
        setPosts(data || []);
        setCurrentPage(data.postIdId);
        setTotalPages(data.totalPages);
      })
      .catch(err => {
        setError(err.message);
        console.error('게시글 로드 실패:', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPosts(0, searchTerm);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPosts(0, searchTerm);
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
                <th scope="col" style={{width: '10%'}}>번호</th>
                <th scope="col" style={{width: '50%'}}>제목</th>
                <th scope="col" style={{width: '15%'}}>작성자</th>
                <th scope="col" style={{width: '15%'}}>작성일</th>
                <th scope="col" style={{width: '10%'}}>조회수</th>
              </tr>
            </thead>
            <tbody>
              {posts.length > 0 ? (
                posts.map((post, index) => (
                  <tr key={post.postId} onClick={() => navigate(`/board/${post.postId}`)}>
                    <td>{post.postId}</td>
                    <td>
                      <Link to={`/board/${post.postId}`} className="post-title">
                        {post.title}
                      </Link>
                    </td>
                    <td>{post.author?.nickname || '-'}</td>
                    <td>{new Date(post.createdAt).toLocaleDateString()}</td>
                    <td>{post.viewCount || 0}</td>
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
                    <button className="page-link" onClick={() => fetchPosts(page, searchTerm)}>{page + 1}</button>
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
