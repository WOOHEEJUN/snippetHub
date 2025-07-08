import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../css/Board.css';

function Board() {
  const navigate = useNavigate();
  const { user, getAuthHeaders } = useAuth();
  const [posts, setPosts] = useState([]);

  const handleWrite = () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      navigate('/login');
    } else {
      navigate('/board/write');
    }
  };

  useEffect(() => {
  fetch('/api/v1/posts', {
    headers: getAuthHeaders(),
  })
    .then(res => res.json())
    .then(data => {
      setPosts(data.content || []); // ✅ 중요!!
    })
    .catch(err => {
      console.error('게시글 로드 실패:', err);
    });
}, []);
  return (
    <div className="container mt-5 board-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>📋 자유 게시판</h2>
        <button className="btn btn-success" onClick={handleWrite}>
          게시물 작성
        </button>
      </div>

      <table className="table table-hover">
        <thead className="table-light">
          <tr>
            <th scope="col">번호</th>
            <th scope="col">제목</th>
            <th scope="col">작성자</th>
            <th scope="col">작성일</th>
            <th scope="col">추천수</th>
          </tr>
        </thead>
        <tbody>
          {posts.length === 0 ? (
            <tr>
              <td colSpan="5" className="text-center text-muted">
                등록된 게시물이 없습니다.
              </td>
            </tr>
          ) : (
            posts.map((post, index) => (
              <tr key={post.id}>
                <td>{index + 1}</td>
                <td>{post.title}</td>
                <td>{post.author.nickname}</td>
                <td>{new Date(post.createdAt).toLocaleDateString()}</td>
                <td>{post.likes}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Board;
