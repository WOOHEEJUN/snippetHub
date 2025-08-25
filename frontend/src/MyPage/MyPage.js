import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import LevelProgress from '../components/LevelProgress';
import { getLevelBadgeImage } from '../utils/badgeUtils';
import '../css/Mypage.css';

function MyPage() {
  const { user } = useAuth();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }

    fetch('/api/users/profile', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : Promise.reject('유저 정보 불러오기 실패')))
      .then((data) => setUserInfo(data.data))
      .catch(() => alert('유저 정보를 불러오는 데 실패했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="loading-message">로딩 중...</p>;
  if (!userInfo)  return <p className="error-message">유저 정보를 불러올 수 없습니다.</p>;

  return (
    <div className="mypage-main">
      {/* ✅ 내 정보 카드 (레벨 정보 포함, 한 번만 렌더링) */}
      <div className="mypage-card user-info-card">
        <h3 className="card-title">내 정보</h3>
        <div className="user-info-details">
          <p><strong>이메일:</strong> {userInfo.email}</p>
          <p>
            <strong>닉네임:</strong>{' '}
            {userInfo.level && (
              <img
                src={getLevelBadgeImage(userInfo.level)}
                alt={userInfo.level}
                className="level-badge-mypage"
              />
            )}
            {userInfo.nickname}
          </p>
          <p><strong>가입일:</strong> {new Date(userInfo.joinDate).toLocaleDateString()}</p>
        </div>

        {/* ✅ 레벨 정보: 카드 안, 가운데 정렬 */}
        <div className="user-info-level">
          <LevelProgress
            userLevel={userInfo.level}
            userPoints={userInfo.points || 0}
          />
        </div>
      </div>

      {/* 내 활동 카드 */}
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
      </div>

      {/* 뱃지 가이드 카드 */}
      <div className="mypage-card badge-guide-card">
        <h3 className="card-title">뱃지 가이드</h3>
        <p>획득할 수 있는 뱃지 종류와 조건을 확인해보세요.</p>
        <a href="mypage/badge-guide" className="btn btn-primary">뱃지 가이드로 이동</a>
      </div>
    </div>
  );
}

export default MyPage;
