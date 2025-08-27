// src/pages/MyBadges.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaCrown, FaCoins, FaAward, FaChartBar } from 'react-icons/fa';
import '../css/MyBadges.css';

/* ---------------- 공용 유틸 ---------------- */
const parseJsonSafe = async (res) => {
  try {
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) return await res.json();
  } catch (_) {}
  return null;
};
const extractArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data?.content)) return data.data.content;
  return [];
};
const norm = (s) => String(s ?? '').trim().toUpperCase();

/* ---------- 희귀도 계산(가이드와 동일 기준) ---------- */
const computeRarity = (b) => {
  const name = norm(b?.name);
  const rc = Number(b?.required_count ?? b?.requiredCount ?? b?.goal ?? 0) || 0;
  const pts = Number(b?.points_reward ?? b?.pointsReward ?? 0) || 0;
  const explicit = b?.isRare === true || /LEGEND|GRANDMASTER|DIAMOND|10000|365/.test(name);
  if (explicit || rc >= 1000 || pts >= 1000) return 'legendary';
  if (rc >= 500   || /MASTER|5000|LOGIN_STREAK_365/.test(name) || pts >= 500) return 'epic';
  if (rc >= 100   || /PLATINUM|100\b/.test(name) || pts >= 200) return 'rare';
  if (rc >= 25    || /GOLD|25\b/.test(name) || pts >= 50)       return 'uncommon';
  return 'common';
};
const rarityToTier = { legendary: 's', epic: 'a', rare: 'b', uncommon: 'c', common: 'd' };

/* ---------- 중앙 코어 이미지(가이드와 동일) ---------- */
const CenterBadge = ({ rarity, alt }) => {
  const tier = rarityToTier[rarity] || 'f';
  const src = `/badges/badge_${tier}.png`;
  return (
    <div className="badge-icon-container">
      <img
        src={src}
        alt={alt}
        className="badge-image-actual"
        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/badges/badge_f.png'; }}
      />
    </div>
  );
};

/* ---------------- 뱃지 정규화 ---------------- */
const normalizeBadge = (b, idx = 0) => {
  const category = (b?.category ?? b?.badgeCategory ?? b?.type ?? 'OTHER')
    .toString()
    .toUpperCase();

  const n = {
    badgeId: b?.badgeId ?? b?.id ?? b?.badge_id ?? `badge-${idx}`,
    name: b?.name ?? b?.title ?? b?.badgeName ?? '이름 없음',
    description: b?.description ?? b?.desc ?? '',
    category,
    requiredCount: b?.requiredCount ?? b?.requirementCount ?? b?.goal ?? 1,
    currentProgress: b?.currentProgress ?? b?.progress ?? 0,
    requirements: b?.requirements ?? b?.requirementList ?? [],
    rewards: b?.rewards ?? b?.rewardList ?? [],
    pointsReward: b?.points_reward ?? b?.pointsReward ?? 0,
    owned: b?.owned ?? b?.isOwned ?? true,
    color: b?.color ?? '#8ab0d1',
    earnedAt: b?.earnedAt ?? b?.awarded_at ?? null,
    isFeatured: b?.isFeatured ?? false,
  };
  n.rarity = computeRarity(n);
  return n;
};

/* ===================================================== */
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
          fetch('/api/users/profile', { headers: getAuthHeaders(), credentials: 'include', cache: 'no-store' }),
          fetch('/api/badges/my', { headers: getAuthHeaders(), credentials: 'include', cache: 'no-store' }),
          fetch('/api/badges/my/featured', { headers: getAuthHeaders(), credentials: 'include', cache: 'no-store' }),
        ]);

        const profileData = await profileRes.json().catch(() => ({}));
        const badgesData = await parseJsonSafe(badgesRes);
        const featuredData = await parseJsonSafe(featuredRes);

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

        // 내 뱃지
        let rawBadges = [];
        if (badgesData?.success && badgesData?.data) rawBadges = Array.isArray(badgesData.data) ? badgesData.data : [];
        else if (Array.isArray(badgesData)) rawBadges = badgesData;
        const normBadges = rawBadges.map((b, i) => normalizeBadge(b, i));
        setBadges(normBadges);

        // 대표 뱃지
        let rawFeatured = [];
        if (featuredData?.success && featuredData?.data) rawFeatured = Array.isArray(featuredData.data) ? featuredData.data : [];
        else if (Array.isArray(featuredData)) rawFeatured = featuredData;
        const normFeatured = rawFeatured.map((b, i) => normalizeBadge(b, i));
        setFeaturedBadges(normFeatured);

        // 선택: 통계
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

  const isFeatured = (badgeId) => featuredBadges.some((b) => b.badgeId === badgeId);

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
            {featuredBadges.map((badge) => {
              const rarity = badge.rarity ?? computeRarity(badge);
              return (
                <div
                  key={badge.badgeId}
                  className="badge-item featured"
                  data-rarity={rarity}               /* ✅ 휘장(오라) CSS 적용 */
                >
                  <CenterBadge rarity={rarity} alt={badge.name} />
                  <div className="badge-name">{badge.name}</div>

                  {/* 대표는 '해제하기'만 노출(hover 시 보이게) */}
                  <div className="badge-actions">
                    <button className="equip-button" onClick={() => handleToggleFeatured(badge.badgeId)}>
                      대표 뱃지 해제
                    </button>
                  </div>
                </div>
              );
            })}
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
              const rarity = badge.rarity ?? computeRarity(badge);
              const featured = isFeatured(badge.badgeId);
              return (
                <div
                  key={badge.badgeId}
                  className={`badge-item ${featured ? 'featured' : ''} ${badge.owned ? '' : 'not-owned'}`}
                  data-rarity={rarity}               /* ✅ 휘장(오라) CSS 적용 */
                >
                  <CenterBadge rarity={rarity} alt={badge.name} />
                  <div className="badge-name">{badge.name}</div>

                  {/* hover 시만 버튼 노출: CSS에서 .badge-item:hover .badge-actions {opacity:1;pointer-events:auto;} */}
                  {badge.owned && (
                    <div className="badge-actions">
                      {featured ? (
                        <button className="equip-button" onClick={() => handleToggleFeatured(badge.badgeId)}>
                          대표 뱃지 해제
                        </button>
                      ) : (
                        <button className="equip-button" onClick={() => handleToggleFeatured(badge.badgeId)}>
                          대표 뱃지 설정
                        </button>
                      )}
                    </div>
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
