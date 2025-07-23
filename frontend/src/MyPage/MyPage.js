import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/Mypage.css';

function MyPage() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ accessToken으로 수정
  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    fetch('/api/users/profile', {
      headers: {
        Authorization: `Bearer ${token}`, // ✅ 올바른 토큰 헤더로 수정
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('유저 정보 불러오기 실패');
        return res.json();
      })
      .then((data) => {
        console.log('📦 유저 응답:', data);
        setUserInfo(data.data);         // ✅ 응답 구조에 맞게 data.data
        setUserStats(data.data.stats);  // ✅ stats 분리
      })
      .catch((err) => {
        console.error(err);
        alert('유저 정보를 불러오는 데 실패했습니다.');
      })
      .finally(() => setLoading(false));
  }, [token]);

  const goToMyPosts = () => navigate('/mypage/posts');
  const goToMySnippets = () => navigate('/mypage/snippets');
  const goToEditProfile = () => navigate('/mypage/edit');

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    alert('로그아웃 되었습니다.');
    navigate('/login');
  };

  if (loading) return <p className="loading-message">로딩 중...</p>;

  return (
    <div className="mypage-container">
      <h2>마이페이지</h2>

      {userInfo ? (
        <div className="mypage-card user-info-card">
          <h3 className="card-title">내 정보</h3>
          <div className="user-info-details">
            <p><strong>이메일:</strong> {userInfo.email}</p>
            <p><strong>닉네임:</strong> {userInfo.nickname}</p>
            <p><strong>레벨:</strong> {userInfo.level}</p>
            <p><strong>포인트:</strong> {userInfo.points}</p>
            <p><strong>자기소개:</strong> {userInfo.bio || '자기소개가 없습니다.'}</p>
            <p><strong>가입일:</strong> {new Date(userInfo.joinDate).toLocaleDateString()}</p>
          </div>
        </div>
      ) : (
        <p className="error-message">유저 정보를 불러올 수 없습니다.</p>
      )}

      <div className="mypage-card activity-card">
        <h3 className="card-title">내 활동</h3>
        <div className="activity-summary">
          <p>
            지금까지 총 <strong>{userStats?.totalPosts ?? 0}개</strong>의 게시글,
            <strong> {userStats?.totalSnippets ?? 0}개</strong>의 스니펫을 작성했습니다.
          </p>
          <p>
            댓글 <strong>{userStats?.totalComments ?? 0}개</strong>,
            좋아요 <strong>{userStats?.totalLikes ?? 0}개</strong>,
            조회수 <strong>{userStats?.totalViews ?? 0}회</strong>
          </p>
        </div>
        <div className="mypage-actions">
          <button className="btn btn-primary-custom" onClick={goToMyPosts}>게시글 보기</button>
          <button className="btn btn-primary-custom" onClick={goToMySnippets}>스니펫 보기</button>
        </div>
      </div>

      <div className="mypage-controls">
        <button className="btn btn-secondary-custom" onClick={goToEditProfile}>개인정보 수정</button>
        <button className="btn btn-secondary-custom" onClick={handleLogout}>로그아웃</button>
      </div>
    </div>
  );
}

export default MyPage;
