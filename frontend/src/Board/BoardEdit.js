// src/Board/BoardEdit.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // useAuth 훅 임포트

function BoardEdit() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { getAuthHeaders } = useAuth(); // getAuthHeaders 훅 사용
  const [post, setPost] = useState({ title: '', content: '', imageUrl: '' }); // imageUrl 상태 추가
  const [imageFile, setImageFile] = useState(null); // 이미지 파일 상태
  const [previewImageUrl, setPreviewImageUrl] = useState(''); // 미리보기 이미지 URL 상태
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    fetch(`/api/posts/${postId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setPost({ title: data.title, content: data.content, imageUrl: data.imageUrl || '' });
        setPreviewImageUrl(data.imageUrl || ''); // 기존 이미지 미리보기 설정
        setLoading(false);
      });
  }, [postId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPost((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewImageUrl(event.target.result); // 새 이미지 미리보기 설정
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }

      let finalImageUrl = post.imageUrl; // 기존 이미지 URL 유지

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

      // 3. 게시글 데이터와 함께 이미지 URL 전송
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ ...post, imageUrl: finalImageUrl }),
      });

      if (!response.ok) {
        throw new Error('수정 실패');
      }

      alert('게시글이 수정되었습니다.');
      navigate(`/board/${postId}`);
    } catch (err) {
      alert('수정 중 오류: ' + err.message);
    }
  };

  if (loading) return <p className="text-center mt-4">⏳ 게시글을 불러오는 중입니다...</p>;

  return (
    <div className="container mt-5">
      <div className="card shadow-sm p-4">
        <h2 className="mb-4 text-primary">📄 게시글 수정</h2>

        <div className="mb-3">
          <label htmlFor="title" className="form-label">제목</label>
          <input
            type="text"
            id="title"
            name="title"
            className="form-control"
            value={post.title}
            onChange={handleChange}
            placeholder="제목을 입력하세요"
          />
        </div>

        <div className="mb-3">
          <label htmlFor="content" className="form-label">내용</label>
          <textarea
            id="content"
            name="content"
            className="form-control"
            rows="10"
            value={post.content}
            onChange={handleChange}
            placeholder="내용을 입력하세요"
          />
        </div>

        <div className="mb-4">
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

        <div className="text-end">
          <button className="btn btn-outline-primary" onClick={handleUpdate}>
            💾 수정 완료
          </button>
        </div>
      </div>
    </div>
  );
}

export default BoardEdit;
