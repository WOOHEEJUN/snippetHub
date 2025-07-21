// src/Board/BoardWrite.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/Board.css';

function BoardWrite() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }

      const response = await fetch('/api/v1/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content }),
      });

      if (!response.ok) {
        throw new Error('게시물 등록 실패');
      }

      alert('게시물이 등록되었습니다.');
      navigate('/board');
    } catch (error) {
      alert('오류 발생: ' + error.message);
    }
  };

  return (
    <div className="container mt-5 board-write-container">
      <h2 className="mb-4">📝 게시물 작성</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="title" className="form-label">제목</label>
          <input
            type="text"
            id="title"
            className="form-control"
            placeholder="제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="content" className="form-label">내용</label>
          <textarea
            id="content"
            className="form-control"
            rows="8"
            placeholder="내용을 입력하세요"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          ></textarea>
        </div>
        <div className="d-flex justify-content-between">
          <button type="submit" className="btn btn-primary">작성</button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/board')}>
            취소
          </button>
        </div>
      </form>
    </div>
  );
}

export default BoardWrite;