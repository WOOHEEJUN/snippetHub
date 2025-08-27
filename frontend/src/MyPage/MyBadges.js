import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaCrown, FaCoins } from 'react-icons/fa';
import '../css/MyBadges.css';

/* ===== 공통 유틸 (가이드와 동일) ===== */
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

/* ===== 희귀도/티어 계산 (뱃지 가이드와 동일 로직) ===== */
const computeRarity = (b) => {
  const name = norm(b.name);
  const rc = Number(b.required_count ?? b.requiredCount ?? b.goal ?? 0) || 0;
  const pts = Number(b.points_reward ?? b.pointsReward ?? 0) || 0;

  const isLegendName = /LEGEND|GRANDMASTER|DIAMOND|MYTHIC|GOD|CHALLENGER|10000|365/.test(name);
  const isEpicName    = /MASTER|PLATINUM|TOP_?100|STREAK_?180/.test(name);
  const isRareName    = /GOLD|500\b|STREAK_?90/.test(name);
  const isUncommonNm  = /SILVER|100\b|STREAK_?30/.test(name);

  if (b.isRare === true || isLegendName || rc >= 2000 || pts >= 2000) return 'legendary';
  if (isEpicName   || rc >= 800  || pts >= 1200) return 'epic';
  if (isRareName   || rc >= 300  || pts >= 400 ) return 'rare';
  if (isUncommonNm || rc >= 80   || pts >= 120 ) return 'uncommon';
  return 'common';
};
const RARITY_TO_TIER = { legendary:'s', epic:'a', rare:'b', uncommon:'c', common:'d' };
const tierHintFromName = (name) => {
  const s = norm(name);
  if (/\bS(\b|_RANK|_TIER)/.test(s)) return 's';
  if (/\bA(\b|_RANK|_TIER)/.test(s)) return 'a';
  if (/\bB(\b|_RANK|_TIER)/.test(s)) return 'b';
  if (/\bC(\b|_RANK|_TIER)/.test(s)) return 'c';
  if (/\bD(\b|_RANK|_TIER)/.test(s)) return 'd';
  if (/\bF(\b|_RANK|_TIER|_BADGE)?\b/.test(s)) return 'f';
  return null;
};
const computeTierLetter = (b) => {
  const direct = (b?.tier ?? b?.grade ?? '').toString().trim().toLowerCase();
  if (['s','a','b','c','d','f'].includes(direct)) return direct;

  const name = norm(b?.name ?? '');
  const rc = Number(b?.required_count ?? b?.requiredCount ?? b?.goal ?? 0) || 0;
  const pts = Number(b?.points_reward  ?? b?.pointsReward ?? 0) || 0;

  if (/LEGEND|GRANDMASTER|DIAMOND|MYTHIC|GOD/.test(name) || rc >= 2000 || pts >= 2000) return 's';
  if (/MASTER|PLATINUM|TOP_?100|STREAK_?180/.test(name) || rc >= 1000 || pts >= 1200) return 'a';
  if (/GOLD|500\b|STREAK_?120/.test(name)      || rc >= 400  || pts >= 600 ) return 'b';
  if (/SILVER|100\b|STREAK_?60/.test(name)     || rc >= 150  || pts >= 250 ) return 'c';
  if (/BRONZE|25\b|STREAK_?14/.test(name)      || rc >= 40   || pts >= 80  ) return 'd';

  const hinted = tierHintFromName(b?.name ?? '');
  if (hinted) return hinted;

  const viaRarity = RARITY_TO_TIER[(b?.rarity ?? '').toLowerCase()];
  return viaRarity || 'f';
};

/* ===== 정규화 (가이드와 동일 골격) ===== */
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
    pointsReward: b?.points_reward ?? b?.pointsReward ?? 0,
    owned: b?.owned ?? b?.isOwned ?? true,
  };
  n.rarity = computeRarity({ ...b, ...n });
  n.tierLetter = computeTierLetter({ ...b, ...n });
  return n;
};

/* ===== 가이드와 동일한 중앙 PNG 컴포넌트 ===== */
const badgePngSrc = (t) => `/badges/badge_${t || 'f'}.png`;
const CenterBadge = ({ tier = 'f', alt }) => (
  <div className="badge-icon-container">
    <img
      src={badgePngSrc(tier)}
      alt={alt}
      className="badge-core-img"
      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/badges/badge_f.png'; }}
    />
  </div>
);

/* ===== MyBadges ===== */
export default function MyBadges() {
  const { user, getAuthHeaders, updateRepresentativeBadge } = useAuth();

  const [level, setLevel] = useState(null);
  const [points, setPoints] = useState(null);
  const [badges, setBadges] = useState([]);
  const [featuredBadges, setFeaturedBadges] = useState([]);
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

  /* 대표는 항상 1개만 유지 */
  const theFeatured = useMemo(() => featuredBadges[0] ?? null, [featuredBadges]);
  const hasFeatured = !!theFeatured;

  const handleToggleFeatured = useCallback(
    async (badge) => {
      try {
        const isCurrentlyFeatured = theFeatured?.badgeId === badge.badgeId;

        if (isCurrentlyFeatured) {
          await fetch(`/api/badges/${badge.badgeId}/feature?featured=false`, {
            method: 'PUT', headers: getAuthHeaders(), credentials: 'include',
          });
          updateRepresentativeBadge(null);
          setFeaturedBadges([]);
          return;
        }

        if (theFeatured) {
          await fetch(`/api/badges/${theFeatured.badgeId}/feature?featured=false`, {
            method: 'PUT', headers: getAuthHeaders(), credentials: 'include',
          }).catch(() => {});
        }
        await fetch(`/api/badges/${badge.badgeId}/feature?featured=true`, {
          method: 'PUT', headers: getAuthHeaders(), credentials: 'include',
        });

        updateRepresentativeBadge(badge);
        setFeaturedBadges([badge]);
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
            <div className="value">
              {points ? (<><strong>{points.point}</strong><small>&nbsp;P</small></>) : '정보 없음'}
            </div>
          </div>
        </Link>
      </div>

      {/* 대표 뱃지 (가이드와 동일한 센터 PNG 사용) */}
      <div className="badge-section">
        <h3>대표 뱃지</h3>
        {!hasFeatured ? (
          <div className="no-badges">대표 뱃지가 없습니다.</div>
        ) : (
          <div className="featured-grid">
            <div className="badge-item featured" data-rarity={theFeatured.rarity}>
              <CenterBadge tier={theFeatured.tierLetter} alt={theFeatured.name} />
              <div className="badge-name" title={theFeatured.name}>{theFeatured.name}</div>
              <button className="equip-button danger" onClick={() => handleToggleFeatured(theFeatured)}>
                대표 뱃지 해제
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 내 모든 뱃지 (가이드와 동일하게 표시) */}
      <div className="badge-section">
        <h3>내 모든 뱃지</h3>
        {badges.length === 0 ? (
          <div className="no-badges">획득한 뱃지가 없습니다.</div>
        ) : (
          <div className="badge-grid">
            {badges.map((badge) => {
              const isFeatured = theFeatured?.badgeId === badge.badgeId;
              return (
                <div
                  key={badge.badgeId}
                  className={`badge-item ${isFeatured ? 'featured' : ''} ${badge.owned ? '' : 'not-owned'}`}
                  data-rarity={badge.rarity}
                >
                  <CenterBadge tier={badge.tierLetter} alt={badge.name} />
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
