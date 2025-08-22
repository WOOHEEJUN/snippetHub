
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../css/MyBadges.css';
import { FaCrown, FaCoins, FaAward, FaChartBar } from 'react-icons/fa';
import { getBadgeIcon } from '../utils/badgeIcon';

function MyBadges() {
  const { user, getAuthHeaders } = useAuth();
  const [level, setLevel] = useState(null);
  const [points, setPoints] = useState(null);
  const [badges, setBadges] = useState([]);
  const [representativeBadge, setRepresentativeBadge] = useState(null);
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
        const [profileRes, badgesRes, representativeRes] = await Promise.all([
          fetch('/api/users/profile', { headers: getAuthHeaders(), credentials: 'include' }),
          fetch('/api/badges/my', { headers: getAuthHeaders(), credentials: 'include' }),
          fetch('/api/users/me/representative-badge', { headers: getAuthHeaders(), credentials: 'include' }),
        ]);

        const profileData = await profileRes.json();
        const badgesData = await badgesRes.json();
        const representativeData = await representativeRes.json();

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
        setRepresentativeBadge(representativeData.data || null);

      } catch (err) {
        console.error('데이터 불러오기 실패:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, getAuthHeaders]);

  const handleSetRepresentativeBadge = useCallback(async (badgeId) => {
    try {
      // If the clicked badge is already representative, unequip it.
      if (representativeBadge && representativeBadge.badgeId === badgeId) {
        const response = await fetch(`/api/users/me/representative-badge`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || '대표 뱃지 해제 실패');
        }
        setRepresentativeBadge(null);
      } else { // Equip the new badge
        const response = await fetch(`/api/users/me/representative-badge`, {
          method: 'PUT',
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ badgeId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || '대표 뱃지 설정 실패');
        }
        const newRepresentativeBadge = badges.find(b => b.badgeId === badgeId);
        setRepresentativeBadge(newRepresentativeBadge);
      }
    } catch (err) {
      alert(err.message);
      console.error('대표 뱃지 설정 실패:', err);
    }
  }, [getAuthHeaders, badges, representativeBadge]);

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
        <h3>대표 뱃지</h3>
        {!representativeBadge
          ? <div className="no-badges">대표 뱃지가 없습니다.</div>
          : (
            <div className="badge-grid">
              <div
                className="badge-item representative"
                onClick={() => handleSetRepresentativeBadge(representativeBadge.badgeId)}
              >
                <div className="badge-icon-container">
                  {getBadgeIcon(representativeBadge.name)}
                </div>
                <div className="badge-name">{representativeBadge.name}</div>
                <button className="equip-button">해제</button>
              </div>
            </div>
          )
        }
      </div>

      <div className="badge-section">
        <h3>내 모든 뱃지</h3>
        {badges.length === 0
          ? <div className="no-badges">획득한 뱃지가 없습니다.</div>
          : (
            <div className="badge-grid">
              {badges.map(badge => {
                const isRepresentative = representativeBadge && representativeBadge.badgeId === badge.badgeId;
                return (
                  <div
                    key={badge.badgeId}
                    className={`badge-item ${isRepresentative ? 'representative' : ''} ${badge.owned ? '' : 'not-owned'}`}
                    onClick={() => badge.owned && handleSetRepresentativeBadge(badge.badgeId)}
                  >
                    <div className="badge-icon-container">
                      {getBadgeIcon(badge.name)}
                    </div>
                    <div className="badge-name">{badge.name}</div>
                    {badge.owned && (
                      <button className="equip-button">
                        {isRepresentative ? '해제' : '장착'}
                      </button>
                    )}
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
