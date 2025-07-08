// src/MyPage/MyPage.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/Mypage.css';

function MyPage() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    fetch('/api/v1/users/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('유저 정보 불러오기 실패');
        return res.json();
      })
      .then((data) => {
        setUserInfo(data);
        setLoading(false);
      })
      .catch((err) => {
        alert(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>로딩 중...</p>;

  return (
    <div className="mypage-container">
      <h2>🙋 마이페이지</h2>

      {userInfo ? (
        <div className="user-info">
          <p><strong>이메일:</strong> {userInfo.email}</p>
          <p><strong>닉네임:</strong> {userInfo.nickname}</p>
          {userInfo.grade && (
            <p><strong>등급:</strong> {userInfo.grade}</p>
          )}
          {userInfo.created_at && (
            <p><strong>가입일:</strong> {new Date(userInfo.created_at).toLocaleDateString()}</p>
          )}
        </div>
      ) : (
        <p>유저 정보를 불러올 수 없습니다.</p>
      )}

      <div className="mypage-actions">
        <button className="btn btn-outline-primary" onClick={() => navigate('/mypage/posts')}>
          내가 쓴 게시물 보기
        </button>
        <button className="btn btn-outline-primary" onClick={() => navigate('/mypage/snippets')}>
          내가 쓴 스니펫 보기
        </button>
        <button className="btn btn-outline-secondary" onClick={() => navigate('/mypage/edit')}>
          개인정보 수정
        </button>
      </div>
    </div>
  );
}

export default MyPage;
