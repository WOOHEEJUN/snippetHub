import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function MyPostDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [post, setPost] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');

  useEffect(() => {
    fetch(`/api/v1/posts/${postId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('게시글 조회 실패');
        return res.json();
      })
      .then((data) => {
        setPost(data);
        setEditedTitle(data.title);
        setEditedContent(data.content);
      })
      .catch((err) => {
        alert(err.message);
      });
  }, [postId, token]);

  const handleDelete = () => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    fetch(`/api/v1/posts/${postId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('삭제 실패');
        alert('삭제되었습니다.');
        navigate('/mypage/posts');
      })
      .catch((err) => {
        alert(err.message);
      });
  };

  const handleEditSubmit = () => {
    fetch(`/api/v1/posts/${postId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: editedTitle,
        content: editedContent,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('수정 실패');
        return res.json();
      })
      .then((data) => {
        alert('수정되었습니다.');
        setPost(data);
        setIsEditing(false);
      })
      .catch((err) => {
        alert(err.message);
      });
  };

  if (!post) return <p>로딩 중...</p>;

  return (
    <div className="mypost-detail">
      <h2>📄 게시물 상세</h2>

      {isEditing ? (
        <>
          <input
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            placeholder="제목"
            style={{ width: '100%', marginBottom: '10px' }}
          />
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            placeholder="내용"
            style={{ width: '100%', height: '200px' }}
          />
          <button onClick={handleEditSubmit}>수정 완료</button>
          <button onClick={() => setIsEditing(false)}>취소</button>
        </>
      ) : (
        <>
          <h3>{post.title}</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{post.content}</p>
          <p>
            작성자: {post.author.nickname} / 작성일:{' '}
            {new Date(post.createdAt).toLocaleString()}
          </p>
          <button onClick={() => setIsEditing(true)}>수정</button>
          <button onClick={handleDelete}>삭제</button>
        </>
      )}
    </div>
  );
}

export default MyPostDetail;
