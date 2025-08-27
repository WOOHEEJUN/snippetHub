import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaCrown, FaCoins } from 'react-icons/fa';
import { getBadgeImagePath } from '../utils/badgeUtils';
import '../css/MyBadges.css';

/* ---------- 유틸 ---------- */
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

/* 희귀도(휘장 오라용 – 단순판) */
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

/* 정규화 */
const normalizeBadge = (b, idx = 0) => {
  const n = {
    badgeId: b?.badgeId ?? b?.id ?? b?.badge_id ?? `badge-${idx}`,
    name: b?.name ?? b?.title ?? b?.badgeName ?? '이름 없음',
    description: b?.description ?? b?.desc ?? '',
    category: (b?.category ?? b?.badgeCategory ?? b?.type ?? 'OTHER').toString().toUpperCase(),
    requiredCount: b?.requiredCount ?? b?.requirementCount ?? b?.goal ?? 1,
    currentProgress: b?.currentProgress ?? b?.progress ?? 0,
    requirements: b?.requirements ?? b?.requirementList ?? [],
    rewards: b?.rewards ?? b?.rewardList ?? [],
    owned: b?.owned ?? b?.isOwned ?? true,
    icon: b?.icon ?? '🏅',
    color: b?.color ?? '#FFD700',
    imageUrl: b?.imageUrl ?? b?.image ?? b?.iconUrl ?? null,
    earnedAt: b?.earnedAt ?? b?.awarded_at ?? null,
    isFeatured: b?.isFeatured ?? false
  };
  n.rarity = computeRarity({ ...b, ...n });
  return n;
};

/* 배지 코어 + 휘장(링/오라) */
const BadgeVisual = ({ badge }) => {
  const [failed, setFailed] = useState(false);
  const src = getBadgeImagePath(badge);
  return (
    <div className="badge-icon-container" data-rarity={badge.rarity}>
      <img
        src={failed ? '/badges/placeholder.png' : src}
        alt={badge.name}
        className="badge-image-actual"
        onError={() => setFailed(true)}
      />
    </div>
  );
};

export default function MyBadges() {
  const { user, getAuthHeaders, updateRepresentativeBadge } = useAuth();

  const [level, setLevel] = useState(null);
  const [points, setPoints] = useState(null);

  const [badges, setBadges] = useState([]);
  const [featuredBadges, setFeaturedBadges] = useState([]); // 서버 원본이 여러 개여도 OK

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* 데이터 로드 */
  useEffect(() => {
    if (!user) {
      setLoading(false);
      setError('로그인이 필요합니다.');
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const [profileRes, badgesRes, featuredRes] = await Promise.all([
          fetch('/api/users/profile', { headers: getAuthHeaders(), credentials: 'include', cache: 'no-store' }),
          fetch('/api/badges/my',     { headers: getAuthHeaders(), credentials: 'include', cache: 'no-store' }),
          fetch('/api/badges/my/featured', { headers: getAuthHeaders(), credentials: 'include', cache: 'no-store' }),
        ]);

        const profileData  = await profileRes.json().catch(() => ({}));
        const badgesData   = await parseJsonSafe(badgesRes);
        const featuredData = await parseJsonSafe(featuredRes);

        if (profileData?.data) {
          setLevel({ levelName: profileData.data.level, level: profileData.data.level });
          setPoints({ point: profileData.data.points });
        }

        setBadges(extractArray(badgesData).map((b, i) => normalizeBadge(b, i)));

        // ✅ 서버가 여러 개를 보내도 화면 상태는 “하나만” 유지
        const incoming = extractArray(featuredData).map((b, i) => normalizeBadge(b, i));
        setFeaturedBadges(incoming.length ? [incoming[0]] : []);
      } catch (e) {
        console.error(e);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    })();
  }, [user, getAuthHeaders]);

  /* 현재 단 하나의 대표(theFeatured) */
  const theFeatured = useMemo(() => featuredBadges[0] ?? null, [featuredBadges]);
  const hasFeatured = !!theFeatured;

  /* 항상 1개만 대표로 유지 */
  const handleToggleFeatured = useCallback(
    async (badge) => {
      try {
        const isCurrentlyFeatured = theFeatured?.badgeId === badge.badgeId;

        if (isCurrentlyFeatured) {
          // 해제
          await fetch(`/api/badges/${badge.badgeId}/feature?featured=false`, {
            method: 'PUT', headers: getAuthHeaders(), credentials: 'include',
          });
          updateRepresentativeBadge(null);
          setFeaturedBadges([]);                 // 상태도 0개
          return;
        }

        // 설정: 기존 대표가 있으면 먼저 해제 → 새 대표 설정
        if (theFeatured) {
          await fetch(`/api/badges/${theFeatured.badgeId}/feature?featured=false`, {
            method: 'PUT', headers: getAuthHeaders(), credentials: 'include',
          }).catch(() => {});
        }
        await fetch(`/api/badges/${badge.badgeId}/feature?featured=true`, {
          method: 'PUT', headers: getAuthHeaders(), credentials: 'include',
        });

        updateRepresentativeBadge(badge);
        setFeaturedBadges([badge]);              // 상태를 단 하나로 고정
      } catch (err) {
        alert(err.message || '대표 뱃지 설정/해제 실패');
        console.error(err);
      }
    },
    [theFeatured, getAuthHeaders, updateRepresentativeBadge]
  );

  if (loading) return <div className="loading-message">데이터를 불러오는 중...</div>;
  if (error)   return <div className="error-message">오류: {error}</div>;

  return (
    <div className="my-badges-page">
      <h2>마이페이지</h2>

      {/* 상단 정보 */}
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

      {/* 대표 뱃지: 항상 가운데 1개 */}
      <div className="badge-section">
        <h3>대표 뱃지</h3>
        {!hasFeatured ? (
          <div className="no-badges">대표 뱃지가 없습니다.</div>
        ) : (
          <div className="featured-grid">
            <div className="badge-item featured">
              <BadgeVisual badge={theFeatured} />
              <div className="badge-name" title={theFeatured.name}>{theFeatured.name}</div>
              <button className="equip-button danger" onClick={() => handleToggleFeatured(theFeatured)}>
                대표 뱃지 해제
              </button>
            </div>
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
              const isFeatured = theFeatured?.badgeId === badge.badgeId;
              return (
                <div key={badge.badgeId} className={`badge-item ${isFeatured ? 'featured' : ''} ${badge.owned ? '' : 'not-owned'}`}>
                  <BadgeVisual badge={badge} />
                  <div className="badge-name" title={badge.name}>{badge.name}</div>

                  {badge.owned && (
                    <div className="badge-action-overlay">
                      {!isFeatured ? (
                        <button className="overlay-btn" onClick={() => handleToggleFeatured(badge)}>
                          대표 뱃지 설정
                        </button>
                      ) : (
                        <button className="overlay-btn danger" onClick={() => handleToggleFeatured(badge)}>
                          대표 뱃지 해제
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
