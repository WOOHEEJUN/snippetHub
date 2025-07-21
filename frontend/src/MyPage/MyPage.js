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

  if (loading) return <p className="loading-message">로딩 중...</p>;

  return (
    <div className="mypage-container">
      <h2>🙋 마이페이지</h2>

      {userInfo ? (
        <div className="mypage-card user-info-card">
          <h3 className="card-title">내 정보</h3>
          <div className="user-info-details">
            <p><strong>이메일:</strong> {userInfo.email}</p>
            <p><strong>닉네임:</strong> {userInfo.nickname}</p>
            {userActivity?.grade && (
              <p><strong>등급:</strong> {userActivity.grade}</p>
            )}
            {userInfo.created_at && (
              <p><strong>가입일:</strong> {new Date(userInfo.created_at).toLocaleDateString()}</p>
            )}
          </div>
        </div>
      ) : (
        <p className="error-message">유저 정보를 불러올 수 없습니다.</p>
      )}

      <div className="mypage-card activity-card">
        <h3 className="card-title">내 활동</h3>
        <div className="activity-summary">
          <p>
            지금까지 총 <strong>{userActivity?.totalPostCount ?? 0}개</strong>의 게시물을 작성하셨습니다.
          </p>
        </div>
        <div className="mypage-actions">
          <button className="btn btn-primary-custom" onClick={goToMyPosts}>
            일반 게시물 ({userActivity?.freePostCount ?? 0}개)
          </button>
          <button className="btn btn-primary-custom" onClick={goToMySnippets}>
            코드 스니펫 ({userActivity?.snippetCount ?? 0}개)
          </button>
        </div>
      </div>
      
      <div className="mypage-controls">
        <button className="btn btn-secondary-custom" onClick={goToEditProfile}>
          개인정보 수정
        </button>
        <button className="btn btn-secondary-custom" onClick={handleLogout}>
          로그아웃
        </button>
      </div>
    </div>
  );
}

export default MyPage;
