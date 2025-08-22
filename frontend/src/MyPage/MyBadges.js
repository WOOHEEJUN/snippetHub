import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaCrown, FaCoins, FaAward, FaChartBar } from 'react-icons/fa'; 
import { getBadgeImagePath } from '../utils/badgeUtils';

function MyBadges() {
  const { user, getAuthHeaders, updateRepresentativeBadge } = useAuth();
  const [level, setLevel] = useState(null);
  const [points, setPoints] = useState(null);
  const [badges, setBadges] = useState([]);
  const [featuredBadges, setFeaturedBadges] = useState([]);
  const [badgeStats, setBadgeStats] = useState(null); 
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
        const [profileRes, badgesRes, featuredRes] = await Promise.all([
          fetch('/api/users/profile', { headers: getAuthHeaders(), credentials: 'include' }),
          fetch('/api/badges/my', { headers: getAuthHeaders(), credentials: 'include' }),
          fetch('/api/badges/my/featured', { headers: getAuthHeaders(), credentials: 'include' }),
          
        ]);

        const profileData = await profileRes.json();
        const badgesData = await badgesRes.json();
        const featuredBadgesData = await featuredRes.json();

        if (profileData.data) {
          setLevel({
            levelName: profileData.data.level,
            level: profileData.data.level 
          });
          setPoints({
            point: profileData.data.points
          });
        } else {
          setLevel(null);
          setPoints(null);
        }
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
      const isCurrentlyFeatured = featuredBadges.some(b => b.badgeId === badgeId);
      const newFeaturedStatus = !isCurrentlyFeatured; 

      const response = await fetch(`/api/badges/${badgeId}/feature?featured=${newFeaturedStatus}`, {
        method: 'PUT', 
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '대표 뱃지 설정/해제 실패');
      }

      // Update AuthContext with the new representative badge
      if (newFeaturedStatus) {
        const newlyFeaturedBadge = badges.find(b => b.badgeId === badgeId);
        updateRepresentativeBadge(newlyFeaturedBadge);
      } else {
        updateRepresentativeBadge(null); // No representative badge
      }

      setFeaturedBadges(prev => {
        if (newFeaturedStatus) {
          
          const badgeToFeature = badges.find(b => b.badgeId === badgeId);
          return badgeToFeature ? [...prev, badgeToFeature] : prev;
        } else {
          
          return prev.filter(b => b.badgeId !== badgeId);
        }
      });

    } catch (err) {
      alert(err.message);
      console.error('대표 뱃지 토글 실패:', err);
    }
  }, [getAuthHeaders, badges, featuredBadges]); 

  if (loading) return <div className="loading-message">데이터를 불러오는 중...</div>;
  if (error) return <div className="error-message">오류: {error}</div>;

  return (
    <div className="my-badges-page">
      <h2>마이페이지</h2>

      <div className="info-section">
        <Link to="/grade-guide" className="info-card-link">
          <div className="info-card">
            <div className="label"><FaCrown /> 등급</div>
            <div className="value">{level ? level.levelName : '정보 없음'}</div>
          </div>
        </Link>
        <div className="info-card">
          <div className="label"><FaCoins /> 포인트</div>
          <div className="value">{points ? `${points.point} P` : '정보 없음'}</div>
        </div>
      </div>

      
      {badgeStats && (
        <div className="badge-section">
          <h3>뱃지 통계</h3>
          <div className="info-section"> 
            <div className="info-card">
              <div className="label"><FaAward /> 획득 뱃지 수</div>
              <div className="value">{badgeStats.totalBadgesOwned}개</div>
            </div>
            <div className="info-card">
              <div className="label"><FaChartBar /> 총 뱃지 수</div>
              <div className="value">{badgeStats.totalBadgesAvailable}개</div>
            </div>
          </div>
        </div>
      )}

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
                  <div className="badge-icon-container">
                    <img src={getBadgeImagePath(badge.name)} alt={badge.name} className="badge-image-actual" />
                  </div>
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
                    <div className="badge-icon-container">
                      <img src={getBadgeImagePath(badge.name)} alt={badge.name} className="badge-image-actual" />
                    </div>
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