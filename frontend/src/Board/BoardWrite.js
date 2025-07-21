// src/Board/BoardWrite.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // useAuth 훅 임포트
import '../css/Board.css';

function BoardWrite() {
  const navigate = useNavigate();
  const { getAuthHeaders } = useAuth(); // getAuthHeaders 훅 사용
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null); // 이미지 파일 상태
  const [imageUrl, setImageUrl] = useState(''); // 업로드된 이미지 URL 상태

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      // 이미지 미리보기 (선택 사항)
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageUrl(event.target.result); // 미리보기 URL 설정
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }

      let finalImageUrl = '';
      if (imageFile) {
        // 1. S3 Pre-signed URL 요청
        const presignedUrlRes = await fetch('/api/v1/s3/presigned-url', {
          method: 'POST',
          headers: getAuthHeaders({'Content-Type': 'application/json'}),
          body: JSON.stringify({ fileName: imageFile.name, fileType: imageFile.type }),
        });

        if (!presignedUrlRes.ok) {
          throw new Error('Pre-signed URL 요청 실패');
        }
        const { url } = await presignedUrlRes.json();

        // 2. S3에 이미지 업로드
        const uploadRes = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': imageFile.type,
          },
          body: imageFile,
        });

        if (!uploadRes.ok) {
          throw new Error('이미지 S3 업로드 실패');
        }
        finalImageUrl = url.split('?')[0]; // 쿼리 파라미터 제거한 실제 이미지 URL
      }

      // 3. 게시글 데이터와 함께 이미지 URL 전송
      const response = await fetch('/api/v1/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ title, content, imageUrl: finalImageUrl }),
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
              <img src={imageUrl} alt="미리보기" style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }} />
            </div>
          )}
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