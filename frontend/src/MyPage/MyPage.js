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
    navigate('/mypage/posts', { state: { token } });
  };

  const goToMySnippets = () => {
    navigate('/mypage/snippets', { state: { token } });
  };

  const goToEditProfile = () => {
    navigate('/mypage/edit', { state: { token } });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    alert('로그아웃 되었습니다.');
    navigate('/login');
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
        <h2>
          내가 쓴 전체 게시물  ({userActivity?.totalPostCount ?? 0}개)
        </h2>
        <button className="btn btn-outline-primary" onClick={goToMyPosts}>
          내가 쓴 게시물 보기 ({userActivity?.freePostCount ?? 0}개)
        </button>
        <button className="btn btn-outline-primary" onClick={goToMySnippets}>
          내가 작성한 스니펫 보기 ({userActivity?.snippetCount ?? 0}개)
        </button>
        <button className="btn btn-outline-secondary" onClick={goToEditProfile}>
          개인정보 수정
        </button>      
      </div>
    </div>
  );
}

export default MyPage;
