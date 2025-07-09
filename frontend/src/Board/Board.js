import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../css/Board.css';

function Board() {
  const [posts, setPosts] = useState([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetch('/api/v1/posts')
      .then((res) => res.json())
      .then((data) => {
        console.log('📌 게시글 목록:', data); // 응답 구조 확인용
        setPosts(data);
      })
      .catch((err) => console.error('게시글 불러오기 실패:', err));
  }, []);

  const handleWrite = () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      navigate('/login');
    } else {
      navigate('/board/write');
    }
  };

  const handleRowClick = (postId) => {
    navigate(`/board/${postId}`);
  };

  return (
    <div className="board-container">
      <div className="board-header">
        <h2>📌 자유 게시판</h2>
        <button className="board-write-btn" onClick={handleWrite}>글쓰기</button>
      </div>

      <table className="board-table">
        <thead>
          <tr>
            <th>번호</th>
            <th>제목</th>
            <th>작성자</th>
            <th>작성일</th>
          </tr>
        </thead>
        <tbody>
          {posts.length > 0 ? (
            posts.map((post, index) => (
              <tr key={post.postId} onClick={() => handleRowClick(post.postId)}>
                <td>{index + 1}</td>
                <td>{post.title}</td>
                <td>
                  {post.authorNickname || post.author?.nickname || post.user?.nickname || '알 수 없음'}
                </td>
                <td>{new Date(post.createdAt).toLocaleDateString()}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4">게시글이 없습니다.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Board;
