import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../css/BoardForm.css'; // 폼 디자인을 위해 BoardForm.css 재활용

function BoardWrite() {
  const navigate = useNavigate();
  const { getAuthHeaders } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewImageUrl(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !content) {
      setError('제목과 내용을 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let finalImageUrl = '';
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);

        const uploadRes = await fetch('/api/files/upload', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error('이미지 업로드 실패');
        }
        const uploadData = await uploadRes.json();
        finalImageUrl = uploadData.url;
      }

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          title,
          content,
          imageUrl: finalImageUrl, // 이미지 URL 추가
          category: '자유게시판',        
          tags: [],                      
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || '게시물 등록 실패');
      }

      alert('게시물이 등록되었습니다.');
      navigate('/board');
    } catch (err) {
      setError(err.message);
      console.error('❌ 게시물 작성 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="board-form-container">
      <div className="form-header">
        <h1>새 게시글 작성</h1>
        <p className="text-muted">새로운 게시글을 작성합니다.</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

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

        <div className="mb-3">
          <label htmlFor="description" className="form-label">요약</label>
          <textarea
            id="description"
            className="form-control"
            rows="3"
            placeholder="게시글의 간략한 요약을 입력하세요 (선택 사항)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
        </div>

        <div className="mb-3">
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

        <div className="mb-3">
          <label htmlFor="image" className="form-label">이미지 업로드</label>
          <input
            type="file"
            id="image"
            className="form-control"
            accept="image/*"
            onChange={handleImageChange}
          />
          {previewImageUrl && (
            <div className="mt-3">
              <img
                src={previewImageUrl}
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

        <div className="d-flex justify-content-end">
          <button type="button" className="btn btn-secondary me-2" onClick={() => navigate(-1)}>취소</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '작성 중...' : '게시글 작성'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default BoardWrite;