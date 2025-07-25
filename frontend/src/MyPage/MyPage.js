import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/Mypage.css';

function MyPage() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    fetch('/api/users/profile', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.ok ? res.json() : Promise.reject('유저 정보 불러오기 실패'))
      .then((data) => {
        console.log('📦 받은 응답:', data);
        setUserInfo(data.data); // ✅ 여기서 data 전체를 저장
      })
      .catch((err) => {
        console.error(err);
        alert('유저 정보를 불러오는 데 실패했습니다.');
      })
      .finally(() => setLoading(false));
  }, []);

  const goToMyPosts = () => {
    navigate('/mypage/posts', { state: { accessToken: token } });
  };

  const goToMySnippets = () => {
    navigate('/mypage/snippets', { state: { accessToken: token } });
  };

  const goToEditProfile = () => {
    navigate('/mypage/edit', { state: { accessToken: token } });
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    alert('로그아웃 되었습니다.');
    navigate('/login');
  };

  if (loading) return <p className="loading-message">로딩 중...</p>;

  return (
    <div className="mypage-container">
      <h2>마이페이지</h2>

      {userInfo ? (
        <>
          <div className="mypage-card user-info-card">
            <h3 className="card-title">내 정보</h3>
            <div className="user-info-details">
              <p><strong>이메일:</strong> {userInfo.email}</p>
              <p><strong>닉네임:</strong> {userInfo.nickname}</p>
              <p><strong>레벨:</strong> {userInfo.level}</p>
              <p><strong>포인트:</strong> {userInfo.points}</p>
              <p><strong>가입일:</strong> {new Date(userInfo.joinDate).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="mypage-card activity-card">
            <h3 className="card-title">내 활동</h3>
            <div className="activity-stats-grid">
              <div className="stat-item">
                <span className="stat-label">총 게시물</span>
                <span className="stat-value">{userInfo.stats?.totalPosts ?? 0}개</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">총 스니펫</span>
                <span className="stat-value">{userInfo.stats?.totalSnippets ?? 0}개</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">총 댓글</span>
                <span className="stat-value">{userInfo.stats?.totalComments ?? 0}개</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">총 좋아요</span>
                <span className="stat-value">{userInfo.stats?.totalLikes ?? 0}개</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">총 조회수</span>
                <span className="stat-value">{userInfo.stats?.totalViews ?? 0}회</span>
              </div>
            </div>
            <div className="mypage-actions">
              <button className="btn btn-primary-custom" onClick={goToMyPosts}>
                게시물 목록 보기
              </button>
              <button className="btn btn-primary-custom" onClick={goToMySnippets}>
                스니펫 목록 보기
              </button>
            </div>
          </div>
        </>
      ) : (
        <p className="error-message">유저 정보를 불러올 수 없습니다.</p>
      )}

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
