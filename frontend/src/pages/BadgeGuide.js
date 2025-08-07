import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../css/BadgeGuide.css';

function BadgeGuide() {
  const { getAuthHeaders } = useAuth();
  const [badges, setBadges] = useState([]);
  const [userBadges, setUserBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        // 백엔드 API가 준비되지 않은 경우를 위한 임시 데이터
        const mockAllBadges = [
          {
            badgeId: 1,
            name: '[임시 데이터] 첫 게시글',
            description: '[임시 데이터] 첫 번째 게시글을 작성했습니다. (실제 뱃지 시스템은 백엔드 구현 필요)',
            category: 'ACTIVITY',
            imageUrl: '/badges/first-post.png',
            requiredCount: 1,
            requirements: ['게시글 1개 작성'],
            rewards: ['10 포인트']
          },
          {
            badgeId: 2,
            name: '[임시 데이터] 스니펫 마스터',
            description: '[임시 데이터] 10개의 스니펫을 작성했습니다.',
            category: 'ACHIEVEMENT',
            imageUrl: '/badges/snippet-master.png',
            requiredCount: 10,
            requirements: ['스니펫 10개 작성'],
            rewards: ['50 포인트', '특별 아이콘']
          },
          {
            badgeId: 3,
            name: '[임시 데이터] 댓글 왕',
            description: '[임시 데이터] 100개의 댓글을 작성했습니다.',
            category: 'ACHIEVEMENT',
            imageUrl: '/badges/comment-king.png',
            requiredCount: 100,
            requirements: ['댓글 100개 작성'],
            rewards: ['100 포인트']
          },
          {
            badgeId: 4,
            name: '[임시 데이터] 연속 로그인',
            description: '[임시 데이터] 7일 연속으로 로그인했습니다.',
            category: 'SPECIAL',
            imageUrl: '/badges/consecutive-login.png',
            requiredCount: 7,
            requirements: ['7일 연속 로그인'],
            rewards: ['20 포인트']
          },
          {
            badgeId: 5,
            name: '[임시 데이터] AI 탐험가',
            description: '[임시 데이터] AI 기능을 5번 사용했습니다.',
            category: 'SPECIAL',
            imageUrl: '/badges/ai-explorer.png',
            requiredCount: 5,
            requirements: ['AI 코드 평가 5회', 'AI 문제 생성 1회'],
            rewards: ['30 포인트', 'AI 마스터 뱃지']
          }
        ];

        const mockUserBadges = [
          {
            badgeId: 1,
            currentProgress: 1,
            owned: true
          },
          {
            badgeId: 2,
            currentProgress: 3,
            owned: false
          },
          {
            badgeId: 3,
            currentProgress: 15,
            owned: false
          },
          {
            badgeId: 4,
            currentProgress: 5,
            owned: false
          },
          {
            badgeId: 5,
            currentProgress: 2,
            owned: false
          }
        ];

        setBadges(mockAllBadges);
        setUserBadges(mockUserBadges);
        setLoading(false);
        return;

        const [allBadgesRes, userBadgesRes] = await Promise.all([
          fetch('/api/badges', { headers: getAuthHeaders(), credentials: 'include' }),
          fetch('/api/badges/my', { headers: getAuthHeaders(), credentials: 'include' })
        ]);

        const allBadgesData = await allBadgesRes.json();
        const userBadgesData = await userBadgesRes.json();

        setBadges(allBadgesData.data || []);
        setUserBadges(userBadgesData.data || []);
      } catch (err) {
        console.error('뱃지 정보 불러오기 실패:', err);
        setError('뱃지 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, [getAuthHeaders]);

  const categories = [
    { value: 'ALL', label: '전체' },
    { value: 'ACTIVITY', label: '활동' },
    { value: 'ACHIEVEMENT', label: '업적' },
    { value: 'SPECIAL', label: '특별' },
    { value: 'EVENT', label: '이벤트' }
  ];

  const filteredBadges = selectedCategory === 'ALL' 
    ? badges 
    : badges.filter(badge => badge.category === selectedCategory);

  const isOwned = (badgeId) => {
    return userBadges.some(userBadge => userBadge.badgeId === badgeId);
  };

  const getProgressInfo = (badge) => {
    const userBadge = userBadges.find(ub => ub.badgeId === badge.badgeId);
    if (!userBadge) return null;
    
    return {
      current: userBadge.currentProgress || 0,
      required: badge.requiredCount || 1,
      percentage: Math.min(100, ((userBadge.currentProgress || 0) / (badge.requiredCount || 1)) * 100)
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
            <div className="stats-number">{Math.round((userBadges.length / badges.length) * 100)}%</div>
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
                  <img src={badge.imageUrl} alt={badge.name} />
                  {owned && <div className="owned-badge">✓</div>}
                </div>
                
                <div className="badge-info">
                  <h4 className="badge-name">{badge.name}</h4>
                  <p className="badge-description">{badge.description}</p>
                  
                  <div className="badge-category">
                    <span className={`category-tag category-${badge.category.toLowerCase()}`}>
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
                            ></div>
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