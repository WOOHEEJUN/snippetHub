import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import '../css/MyBadges.css';
import { FaCrown, FaCoins, FaAward } from 'react-icons/fa'; // 아이콘 추가

function MyBadges() {
  const { user, getAuthHeaders } = useAuth();
  const [level, setLevel] = useState(null);
  const [points, setPoints] = useState(null);
  const [badges, setBadges] = useState([]);
  const [featuredBadges, setFeaturedBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setError('로그인이 필요합니다.');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [levelRes, pointsRes, badgesRes, featuredRes] = await Promise.all([
          fetch('/api/users/level', { headers: getAuthHeaders(), credentials: 'include' }),
          fetch('/api/points/my', { headers: getAuthHeaders(), credentials: 'include' }),
          fetch('/api/badges/my', { headers: getAuthHeaders(), credentials: 'include' }),
          fetch('/api/badges/my/featured', { headers: getAuthHeaders(), credentials: 'include' })
        ]);

        const levelData = await levelRes.json();
        const pointsData = await pointsRes.json();
        const badgesData = await badgesRes.json();
        const featuredBadgesData = await featuredRes.json();

        setLevel(levelData.data);
        setPoints(pointsData.data);
        setBadges(badgesData.data || []);
        setFeaturedBadges(featuredBadgesData.data || []);

      } catch (err) {
        console.error('데이터 불러오기 실패:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, getAuthHeaders]);

  const handleToggleFeatured = useCallback(async (badgeId) => {
    try {
      const response = await fetch(`/api/badges/${badgeId}/toggle-featured`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '대표 뱃지 설정/해제 실패');
      }

      // 상태 업데이트
      setFeaturedBadges(prev => {
        const isCurrentlyFeatured = prev.some(b => b.badgeId === badgeId);
        if (isCurrentlyFeatured) {
          return prev.filter(b => b.badgeId !== badgeId);
        } else {
          const badgeToFeature = badges.find(b => b.badgeId === badgeId);
          return badgeToFeature ? [...prev, badgeToFeature] : prev;
        }
      });

    } catch (err) {
      alert(err.message);
      console.error('대표 뱃지 토글 실패:', err);
    }
  }, [getAuthHeaders, badges]);

  if (loading) return <div className="loading-message">데이터를 불러오는 중...</div>;
  if (error) return <div className="error-message">오류: {error}</div>;

  return (
    <div className="my-badges-page">
      <h2>마이페이지</h2>

      <div className="info-section">
        <div className="info-card">
          <div className="label"><FaCrown /> 등급</div>
          <div className="value">{level ? `${level.levelName} (Lv.${level.level})` : '정보 없음'}</div>
        </div>
        <div className="info-card">
          <div className="label"><FaCoins /> 포인트</div>
          <div className="value">{points ? `${points.point} P` : '정보 없음'}</div>
        </div>
      </div>

      <div className="badge-section">
        <h3>🏅 대표 뱃지</h3>
        {featuredBadges.length === 0
          ? <div className="no-badges">대표 뱃지가 없습니다.</div>
          : (
            <div className="badge-grid">
              {featuredBadges.map(badge => (
                <div 
                  key={badge.badgeId} 
                  className="badge-item featured"
                  onClick={() => handleToggleFeatured(badge.badgeId)}
                >
                  <img src={badge.imageUrl} alt={badge.name} />
                  <div className="badge-name">{badge.name}</div>
                </div>
              ))}
            </div>
          )
        }
      </div>

      <div className="badge-section">
        <h3>🎖️ 내 모든 뱃지</h3>
        {badges.length === 0
          ? <div className="no-badges">획득한 뱃지가 없습니다.</div>
          : (
            <div className="badge-grid">
              {badges.map(badge => {
                const isFeatured = featuredBadges.some(fb => fb.badgeId === badge.badgeId);
                return (
                  <div 
                    key={badge.badgeId} 
                    className={`badge-item ${isFeatured ? 'featured' : ''} ${badge.owned ? '' : 'not-owned'}`}
                    onClick={() => badge.owned && handleToggleFeatured(badge.badgeId)}
                  >
                    <img src={badge.imageUrl} alt={badge.name} />
                    <div className="badge-name">{badge.name}</div>
                  </div>
                );
              })}
            </div>
          )
        }
      </div>
    </div>
  );
}

export default MyBadges;