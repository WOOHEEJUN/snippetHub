import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../css/BadgeGuide.css';
import { Medal } from 'iconoir-react';

const getBadgeIcon = (badgeName) => {
  if (!badgeName) {
    return <Medal color="lightgray" width="100%" height="100%" />;
  }
  const lowerCaseBadgeName = badgeName.toLowerCase();
  let color = 'lightgray';

  if (lowerCaseBadgeName.includes('bronze')) {
    color = '#cd7f32';
  } else if (lowerCaseBadgeName.includes('silver')) {
    color = '#c0c0c0';
  } else if (lowerCaseBadgeName.includes('gold')) {
    color = '#ffd700';
  } else if (lowerCaseBadgeName.includes('platinum')) {
    color = '#e5e4e2';
  } else if (lowerCaseBadgeName.includes('diamond')) {
    color = '#b9f2ff';
  }

  return <Medal color={color} width="100%" height="100%" />;
};

function BadgeGuide() {
  const { getAuthHeaders } = useAuth();
  const [badges, setBadges] = useState([]);
  const [userBadges, setUserBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    const fetchBadgesAndUser = async () => {
      try {
        // 1) 뱃지 목록
        const response = await fetch('/api/badges', {
          headers: getAuthHeaders(),
          credentials: 'include'
        });
        if (!response.ok) throw new Error('뱃지 목록을 불러오는 중 오류가 발생했습니다.');
        const data = await response.json();

        let serverBadges = [];
        if (data.success && data.data) {
          serverBadges = data.data;
        } else {
          console.warn('백엔드에서 뱃지 데이터를 불러오지 못했습니다.');
        }
        setBadges(serverBadges);

        // 2) 사용자 보유 뱃지
        const userResponse = await fetch('/api/badges/my', {
          headers: getAuthHeaders(),
          credentials: 'include'
        });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          if (userData.success && userData.data) {
            setUserBadges(userData.data);
          }
        }
      } catch (err) {
        console.error('뱃지 목록 불러오기 실패:', err);
        setBadges([]);
        setError('뱃지 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchBadgesAndUser();
  }, [getAuthHeaders]);

  const categories = [
    { value: 'ALL', label: '전체' },
    { value: 'ACTIVITY', label: '활동' },
    { value: 'ACHIEVEMENT', label: '업적' },
    { value: 'SPECIAL', label: '특별' },
    { value: 'EVENT', label: '이벤트' }
  ];

  const filteredBadges = useMemo(() => {
    return selectedCategory === 'ALL'
      ? badges
      : badges.filter(badge => badge.category === selectedCategory);
  }, [badges, selectedCategory]);

  const isOwned = (badgeId) => {
    return userBadges.some(userBadge => userBadge.badgeId === badgeId);
  };

  const getProgressInfo = (badge) => {
    const userBadge = userBadges.find(ub => ub.badgeId === badge.badgeId);
    if (!userBadge) return null;

    return {
      current: userBadge.currentProgress || 0,
      required: badge.requiredCount || 1,
      percentage: Math.min(
        100,
        ((userBadge.currentProgress || 0) / (badge.requiredCount || 1)) * 100
      )
    };
  };

  if (loading) return <div className="loading-message">뱃지 정보를 불러오는 중...</div>;
  if (error) return <div className="error-message">오류: {error}</div>;

  return (
    <div className="badge-guide-page">
      <div className="container">
        <div className="page-header">
          <h1>🏅 뱃지 가이드</h1>
          <p>다양한 활동을 통해 뱃지를 획득하고 성장해보세요!</p>
        </div>

        <div className="stats-section">
          <div className="stats-card">
            <div className="stats-number">{userBadges.length}</div>
            <div className="stats-label">획득한 뱃지</div>
          </div>
          <div className="stats-card">
            <div className="stats-number">{badges.length}</div>
            <div className="stats-label">전체 뱃지</div>
          </div>
          <div className="stats-card">
            <div className="stats-number">
              {badges.length ? Math.round((userBadges.length / badges.length) * 100) : 0}%
            </div>
            <div className="stats-label">달성률</div>
          </div>
        </div>

        <div className="filter-section">
          <h3>카테고리별 필터</h3>
          <div className="category-filters">
            {categories.map(category => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`category-filter ${selectedCategory === category.value ? 'active' : ''}`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        <div className="badges-grid">
          {filteredBadges.map(badge => {
            const owned = isOwned(badge.badgeId);
            const progress = getProgressInfo(badge);

            return (
              <div key={badge.badgeId} className={`badge-card ${owned ? 'owned' : 'not-owned'}`}>
                <div className="badge-image">
                  <div className="badge-icon-container">
                    {getBadgeIcon(badge.name)}
                  </div>
                  {owned && <div className="owned-badge">✓</div>}
                </div>

                <div className="badge-info">
                  <h4 className="badge-name">{badge.name}</h4>
                  <p className="badge-description">{badge.description}</p>

                  <div className="badge-category">
                    <span className={`category-tag category-${String(badge.category || '').toLowerCase()}`}>
                      {categories.find(c => c.value === badge.category)?.label || badge.category}
                    </span>
                  </div>

                  {badge.requiredCount > 1 && (
                    <div className="progress-section">
                      {progress ? (
                        <>
                          <div className="progress-bar">
                            <div
                              className="progress-fill"
                              style={{ width: `${progress.percentage}%` }}
                            />
                          </div>
                          <div className="progress-text">
                            {progress.current} / {progress.required}
                          </div>
                        </>
                      ) : (
                        <div className="progress-text">
                          0 / {badge.requiredCount}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="badge-requirements">
                    <h5>획득 조건:</h5>
                    <ul>
                      {badge.requirements && badge.requirements.map((req, index) => (
                        <li key={index}>{req}</li>
                      ))}
                    </ul>
                  </div>

                  {badge.rewards && (
                    <div className="badge-rewards">
                      <h5>보상:</h5>
                      <ul>
                        {badge.rewards.map((reward, index) => (
                          <li key={index}>{reward}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredBadges.length === 0 && (
          <div className="no-badges">
            <p>해당 카테고리의 뱃지가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default BadgeGuide;