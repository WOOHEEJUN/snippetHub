// src/Board/BoardDetail.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

function BoardDetail() {
  const { id } = useParams(); // URL의 게시글 ID 추출
  const [post, setPost] = useState(null);

  useEffect(() => {
    // 예시: API 또는 로컬 데이터 가져오기
    const fetchPost = async () => {
      // 여기서는 더미로 작성
      const fakePost = {
        id,
        title: '게시글 제목',
        content: '이건 게시글 내용입니다.',
        author: '홍길동',
        date: '2025-07-07',
      };
      setPost(fakePost);
    };

    fetchPost();
  }, [id]);

  if (!post) return <p>로딩 중...</p>;

  return (
    <div className="container mt-5">
      <h2>{post.title}</h2>
      <p className="text-muted">
        작성자: {post.author} | 날짜: {post.date}
      </p>
      <hr />
      <p>{post.content}</p>
    </div>
  );
}

export default BoardDetail;
