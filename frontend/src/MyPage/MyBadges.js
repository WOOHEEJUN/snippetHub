import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaCrown, FaCoins, FaAward, FaChartBar } from 'react-icons/fa';
import { getBadgeImagePath } from '../utils/badgeUtils';
import '../css/MyBadges.css';

/** 안전 JSON 파서 */
const parseJsonSafe = async (res) => {
  try {
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) return await res.json();
  } catch (_) {}
  return null;
};

/** 여러 응답 스키마에서 배열을 뽑아내기 */
const extractArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data?.content)) return data.data.content;
  return [];
};

/** 뱃지 객체 정규화 */
const normalizeBadge = (b, idx = 0) => {
  const category = (b.category ?? b.badgeCategory ?? b.type ?? 'OTHER')
    .toString()
    .toUpperCase();

  return {
    badgeId: b.badgeId ?? b.id ?? b.badge_id ?? `badge-${idx}`,
    name: b.name ?? b.title ?? b.badgeName ?? '이름 없음',
    description: b.description ?? b.desc ?? '',
    category,
    requiredCount: b.requiredCount ?? b.requirementCount ?? b.goal ?? 1,
    requirements: b.requirements ?? b.requirementList ?? [],
    rewards: b.rewards ?? b.rewardList ?? [],
    currentProgress: b.currentProgress ?? b.progress ?? 0,
    owned: b.owned ?? b.isOwned ?? true, // 사용자가 가진 뱃지는 owned = true
    icon: b.icon ?? '🏆',
    color: b.color ?? '#FFD700',
    earnedAt: b.earnedAt ?? new Date().toISOString(),
    isFeatured: b.isFeatured ?? false
  };
};

function MyBadges() {
  const { user, getAuthHeaders, updateRepresentativeBadge } = useAuth();

  const [level, setLevel] = useState(null);
  const [points, setPoints] = useState(null);

  const [badges, setBadges] = useState([]);
  const [featuredBadges, setFeaturedBadges] = useState([]);

  // 선택 사항(통계가 API에 있으면 노출)
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
        console.log('뱃지 데이터 조회 시작...');
        
        const [profileRes, badgesRes, featuredRes] = await Promise.all([
          fetch('/api/users/profile', { headers: getAuthHeaders(), credentials: 'include' }),
          fetch('/api/badges/my', { headers: getAuthHeaders(), credentials: 'include' }),
          fetch('/api/badges/my/featured', { headers: getAuthHeaders(), credentials: 'include' }),
        ]);

        console.log('API 응답 상태:', {
          profile: profileRes.status,
          badges: badgesRes.status,
          featured: featuredRes.status
        });

        const profileData = await profileRes.json().catch(() => ({}));
        const badgesData = await parseJsonSafe(badgesRes);
        const featuredData = await parseJsonSafe(featuredRes);

        console.log('API 응답 데이터:', {
          profile: profileData,
          badges: badgesData,
          featured: featuredData
        });

        if (profileData?.data) {
          setLevel({
            levelName: profileData.data.level,
            level: profileData.data.level,
          });
          setPoints({ point: profileData.data.points });
        } else {
          setLevel(null);
          setPoints(null);
        }

        // 뱃지 데이터 처리 - ApiResponse 구조에 맞게 수정
        let rawBadges = [];
        if (badgesData?.success && badgesData?.data) {
          rawBadges = Array.isArray(badgesData.data) ? badgesData.data : [];
        } else if (Array.isArray(badgesData)) {
          rawBadges = badgesData;
        }
        
        console.log('처리된 뱃지 데이터:', rawBadges);
        const normalizedBadges = rawBadges.map((b, i) => normalizeBadge(b, i));
        setBadges(normalizedBadges);

        // 대표 뱃지 데이터 처리
        let rawFeatured = [];
        if (featuredData?.success && featuredData?.data) {
          rawFeatured = Array.isArray(featuredData.data) ? featuredData.data : [];
        } else if (Array.isArray(featuredData)) {
          rawFeatured = featuredData;
        }
        
        console.log('처리된 대표 뱃지 데이터:', rawFeatured);
        const normalizedFeatured = rawFeatured.map((b, i) => normalizeBadge(b, i));
        setFeaturedBadges(normalizedFeatured);

        // 통계 API가 있으면 여기에 setBadgeStats로 넣어 쓰세요
        // setBadgeStats(statsData?.data)
      } catch (err) {
        console.error('데이터 불러오기 실패:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, getAuthHeaders]);

  const handleToggleFeatured = useCallback(
    async (badgeId) => {
      try {
        const isCurrentlyFeatured = featuredBadges.some((b) => b.badgeId === badgeId);
        const newFeaturedStatus = !isCurrentlyFeatured;

        const response = await fetch(`/api/badges/${badgeId}/feature?featured=${newFeaturedStatus}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || '대표 뱃지 설정/해제 실패');
        }

        if (newFeaturedStatus) {
          const newlyFeaturedBadge = badges.find((b) => b.badgeId === badgeId);
          updateRepresentativeBadge(newlyFeaturedBadge || null);
        } else {
          updateRepresentativeBadge(null);
        }

        setFeaturedBadges((prev) => {
          if (newFeaturedStatus) {
            const badgeToFeature = badges.find((b) => b.badgeId === badgeId);
            return badgeToFeature ? [...prev, badgeToFeature] : prev;
          }
          return prev.filter((b) => b.badgeId !== badgeId);
        });
      } catch (err) {
        alert(err.message);
        console.error('대표 뱃지 토글 실패:', err);
      }
    },
    [getAuthHeaders, badges, featuredBadges, updateRepresentativeBadge]
  );

  if (loading) return <div className="loading-message">데이터를 불러오는 중...</div>;
  if (error) return <div className="error-message">오류: {error}</div>;

  return (
    <div className="my-badges-page">
      <h2>마이페이지</h2>

      {/* --- 가로(한 줄) 정보 타일 --- */}
      <div className="info-section">
        <Link to="/grade-guide" className="info-card-link">
          <div className="info-card">
            <div className="label"><FaCrown /> 등급</div>
            <div className="value">{level ? level.levelName : '정보 없음'}</div>
          </div>
        </Link>

        <Link to="/mypage/point-history" className="info-card-link">
          <div className="info-card">
            <div className="label"><FaCoins /> 포인트</div>
            <div className="value">{points ? <><strong>{points.point}</strong><small>&nbsp;P</small></> : '정보 없음'}</div>
          </div>
        </Link>
      </div>

      {/* (선택) 통계 카드 */}
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

      {/* 대표 뱃지 */}
      <div className="badge-section">
        <h3>대표 뱃지</h3>
        {featuredBadges.length === 0 ? (
          <div className="no-badges">대표 뱃지가 없습니다.</div>
        ) : (
          <div className="badge-grid">
            {featuredBadges.map((badge) => (
              <div key={badge.badgeId} className="badge-item featured">
                <div className="badge-icon-container">
                  <img src={getBadgeImagePath(badge.name)} alt={badge.name} className="badge-image-actual" />
                </div>
                <div className="badge-name">{badge.name}</div>
                <button className="equip-button" onClick={() => handleToggleFeatured(badge.badgeId)}>
                  대표 뱃지 해제
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 내 모든 뱃지 */}
      <div className="badge-section">
        <h3>내 모든 뱃지</h3>
        {badges.length === 0 ? (
          <div className="no-badges">획득한 뱃지가 없습니다.</div>
        ) : (
          <div className="badge-grid">
            {badges.map((badge) => {
              const isFeatured = featuredBadges.some((fb) => fb.badgeId === badge.badgeId);
              return (
                <div
                  key={badge.badgeId}
                  className={`badge-item ${isFeatured ? 'featured' : ''} ${badge.owned ? '' : 'not-owned'}`}
                >
                  <div className="badge-icon-container">
                    <img src={getBadgeImagePath(badge.name)} alt={badge.name} className="badge-image-actual" />
                  </div>
                  <div className="badge-name">{badge.name}</div>
                  {badge.owned && (
                    <button className="equip-button" onClick={() => handleToggleFeatured(badge.badgeId)}>
                      {isFeatured ? '대표 뱃지 해제' : '대표 뱃지 설정'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyBadges;
