// src/MyPage/MyPage.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/Mypage.css';

function MyPage() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [userActivity, setUserActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    fetch('/api/v1/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.ok ? res.json() : Promise.reject('유저 정보 불러오기 실패'))
      .then(setUserInfo)
      .catch((err) => {
        console.error(err);
        alert('유저 정보를 불러오는 데 실패했습니다.');
      });

    fetch('/api/v1/users/me/activity', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.ok ? res.json() : Promise.reject('활동 정보 불러오기 실패'))
      .then(setUserActivity)
      .catch((err) => {
        console.error(err);
        alert('활동 정보를 불러오는 데 실패했습니다.');
      })
      .finally(() => setLoading(false));
  }, []);

  const goToMyPosts = () => {
    navigate('/mypage/posts', {
      state: { token }, // 토큰을 다음 페이지에 넘김
    });
  };

  if (loading) return <p>로딩 중...</p>;

  return (
    <div className="mypage-container">
      <h2>🙋 마이페이지</h2>

      {userInfo ? (
        <div className="user-info">
          <p><strong>이메일:</strong> {userInfo.email}</p>
          <p><strong>닉네임:</strong> {userInfo.nickname}</p>
          {userActivity?.grade && (
            <p><strong>등급:</strong> {userActivity.grade}</p>
          )}
          {userInfo.created_at && (
            <p><strong>가입일:</strong> {new Date(userInfo.created_at).toLocaleDateString()}</p>
          )}
        </div>
      ) : (
        <p>유저 정보를 불러올 수 없습니다.</p>
      )}

      <div className="mypage-actions">
        <button className="btn btn-outline-primary" onClick={goToMyPosts}>
          내가 쓴 게시물 보기 ({userActivity?.postCount ?? 0}개)
        </button>
      </div>
    </div>
  );
}

export default MyPage;
