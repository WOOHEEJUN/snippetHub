import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import LevelProgress from '../components/LevelProgress';
import { getLevelBadgeImage } from '../utils/badgeUtils';
import '../css/Mypage.css';

function MyPage() {
  const { user } = useAuth();
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
        setUserInfo(data.data);
      })
      .catch((err) => {
        alert('유저 정보를 불러오는 데 실패했습니다.');
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <p className="loading-message">로딩 중...</p>;

  return (
    <div className="mypage-container">
      {userInfo ? (
        <>
          <div className="mypage-sidebar">
            <LevelProgress
              userLevel={userInfo.level}
              userPoints={userInfo.points || 0}
            />
            <div className="mypage-card level-definitions-card">
              <h3 className="card-title">모든 레벨 정보</h3>
              <ul className="level-list">
                {[
                  { level: 1, name: 'BRONZE', minPoints: 0, maxPoints: 100, color: '#cd7f32' },
                  { level: 2, name: 'SILVER', minPoints: 100, maxPoints: 500, color: '#c0c0c0' },
                  { level: 3, name: 'GOLD', minPoints: 500, maxPoints: 1000, color: '#ffd700' },
                  { level: 4, name: 'PLATINUM', minPoints: 1000, maxPoints: 2500, color: '#e5e4e2' },
                  { level: 5, name: 'DIAMOND', minPoints: 2500, maxPoints: 5000, color: '#b9f2ff' },
                  { level: 6, name: 'MASTER', minPoints: 5000, maxPoints: 10000, color: '#800080' },
                  { level: 7, name: 'GRANDMASTER', minPoints: 10000, maxPoints: 20000, color: '#ff4500' },
                  { level: 8, name: 'LEGEND', minPoints: 20000, maxPoints: Infinity, color: '#00bfff' },
                ].map((levelInfo) => (
                  <li key={levelInfo.level} className="level-item">
                    <span className="level-name" style={{ color: levelInfo.color }}>{levelInfo.name}</span>
                    <span className="level-points">({levelInfo.minPoints} P {levelInfo.maxPoints === Infinity ? '+' : `- ${levelInfo.maxPoints - 1} P`})</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mypage-main">
            <div className="mypage-card user-info-card">
              <h3 className="card-title">내 정보</h3>
              <div className="user-info-details">
                <p><strong>이메일:</strong> {userInfo.email}</p>
                <p><strong>닉네임:</strong>
                  {userInfo.level && <img src={getLevelBadgeImage(userInfo.level)} alt={userInfo.level} className="level-badge-mypage" />}
                  {userInfo.nickname}
                </p>
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
            </div>
          </div>
        </>
      ) : (
        <p className="error-message">유저 정보를 불러올 수 없습니다.</p>
      )}
    </div>
  );
}

export default MyPage;
