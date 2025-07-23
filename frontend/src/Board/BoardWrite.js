import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../css/Board.css';

function BoardWrite() {
  const navigate = useNavigate();
  const { getAuthHeaders } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);

      const reader = new FileReader();
      reader.onload = (event) => {
        setImageUrl(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  const token = localStorage.getItem('accessToken');
  if (!token) {
    alert('로그인이 필요합니다.');
    return;
  }

  try {
    const response = await fetch('/api/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        title,
        content,
        category: '자유게시판',        
        tags: [],                      
      }),
    });

    if (!response.ok) throw new Error('게시물 등록 실패');

    alert('게시물이 등록되었습니다.');
    navigate('/board');
  } catch (error) {
    console.error('❌ 게시물 작성 오류:', error);
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

        <div className="mb-4">
          <label htmlFor="image" className="form-label">이미지 업로드</label>
          <input
            type="file"
            id="image"
            className="form-control"
            accept="image/*"
            onChange={handleImageChange}
          />
          {imageUrl && (
            <div className="mt-3">
              <img
                src={imageUrl}
                alt="미리보기"
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  borderRadius: '8px',
                }}
              />
            </div>
          )}
        </div>

        <div className="d-flex justify-content-between">
          <button type="submit" className="btn btn-primary">작성</button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/board')}
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}

export default BoardWrite;
