import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../css/BoardForm.css'; // 폼 디자인을 위해 BoardForm.css 재활용

function BoardEdit() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { getAuthHeaders, user } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState([]);
  const [isPublic, setIsPublic] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchPost = useCallback(async () => {
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('게시글 정보를 불러올 수 없습니다.');
      const responseData = await response.json();
      const postData = responseData.data; // 실제 게시글 데이터는 responseData.data에 있습니다.

      // 권한 확인
      if (user?.userId !== postData.author?.userId) {
        alert('수정 권한이 없습니다.');
        navigate(`/board/${postId}`);
        return;
      }

      setTitle(postData.title);
      setContent(postData.content);
      setCategory(postData.category || 'GENERAL'); // 기본값 설정
      setTags(postData.tags || []);
      setIsPublic(postData.isPublic);
      setImageUrl(postData.imageUrl || '');
      setPreviewImageUrl(postData.imageUrl || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [postId, navigate, getAuthHeaders, user]);

  useEffect(() => {
    if (user) { // user 정보가 로드된 후에 게시글 불러오기
      fetchPost();
    }
  }, [fetchPost, user]);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewImageUrl(event.target.result);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !content) {
      setError('제목과 내용을 모두 입력해주세요.');
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      let finalImageUrl = imageUrl; // 기존 이미지 URL 유지

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
        finalImageUrl = uploadData.url; // 서버에서 반환된 이미지 URL
      }

      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ title, content, category, tags, isPublic }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || '게시글 수정에 실패했습니다.');
      }

      alert('게시글이 성공적으로 수정되었습니다.');
      navigate(`/board/${postId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-5"><div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div></div>;

  return (
    <div className="board-form-container">
      <div className="form-header">
        <h1>게시글 수정</h1>
        <p className="text-muted">게시글의 내용을 수정합니다.</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="title" className="form-label">제목</label>
          <input
            type="text"
            id="title"
            className="form-control"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
          />
        </div>

        <div className="mb-3">
          <label htmlFor="content" className="form-label">내용</label>
          <textarea
            id="content"
            className="form-control"
            rows="10"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="내용을 입력하세요"
          ></textarea>
        </div>

        <div className="row mb-3">
          <div className="col-md-6">
            <label htmlFor="category" className="form-label">카테고리</label>
            <select
              id="category"
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="GENERAL">일반</option>
              <option value="QNA">Q&A</option>
              <option value="INFO">정보</option>
            </select>
          </div>
          <div className="col-md-6 d-flex align-items-end">
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="isPublic">
                공개글
              </label>
            </div>
          </div>
        </div>

        <div className="mb-3">
          <label htmlFor="image" className="form-label">이미지 변경</label>
          <input
            type="file"
            id="image"
            className="form-control"
            accept="image/*"
            onChange={handleImageChange}
          />
          {previewImageUrl && (
            <div className="mt-3">
              <img src={previewImageUrl} alt="미리보기" style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }} />
            </div>
          )}
        </div>

        <div className="d-flex justify-content-end">
          <button type="button" className="btn btn-secondary me-2" onClick={() => navigate(-1)}>취소</button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? '수정 중...' : '수정 완료'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default BoardEdit;