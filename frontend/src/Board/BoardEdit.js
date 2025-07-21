// src/Board/BoardEdit.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function BoardEdit() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetch(`/api/v1/posts/${postId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setPost({ title: data.title, content: data.content });
        setLoading(false);
      });
  }, [postId, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPost((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = () => {
    fetch(`/api/v1/posts/${postId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(post),
    })
      .then((res) => {
        if (!res.ok) throw new Error('수정 실패');
        alert('게시글이 수정되었습니다.');
        navigate(`/board/${postId}`);
      })
      .catch((err) => alert('수정 중 오류: ' + err.message));
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
