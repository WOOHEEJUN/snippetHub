import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaCrown, FaCoins } from 'react-icons/fa';
import { getRepresentativeBadgeImage, getLevelBadgeImage } from '../utils/badgeUtils';
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

/* ===== 등급 → 파일명 매핑(정적 폴더) ===== */
const LEVEL_IMG_MAP = {
  BRONZE: '/badges/bronze.png',
  SILVER: '/badges/silver.png',
  GOLD: '/badges/gold.png',
  PLATINUM: '/badges/platinum.png',
  DIAMOND: '/badges/diamond.png',
  MASTER: '/badges/master.png',
  GRANDMASTER: '/badges/grandmaster.png',
  LEGEND: '/badges/legend.png'
};

/* ---------- 이미지 후보 빌더 ---------- */
const buildBadgeImageCandidates = (badge) => {
  const list = [];

  // 1) 대표 배지 유틸(있다면 최우선)
  try {
    if (typeof getRepresentativeBadgeImage === 'function') {
      const fromUtil = getRepresentativeBadgeImage(badge);
      if (fromUtil) list.push(fromUtil);
    }
  } catch (_) {}

  // 2) 서버/객체에서 온 직접 경로
  if (badge?.imageUrl) list.push(badge.imageUrl);

  // 3) 배지 객체에 등급 정보가 있으면 등급 이미지 후보들 추가
  const levelName = norm(badge?.levelName ?? badge?.level ?? '');
  if (levelName) {
    try {
      const fromLevelUtil = getLevelBadgeImage?.(levelName);
      if (fromLevelUtil) list.push(fromLevelUtil);
    } catch (_) {}
    if (LEVEL_IMG_MAP[levelName]) list.push(LEVEL_IMG_MAP[levelName]);
    list.push(`/badges/${levelName.toLowerCase()}.png`); // 관용형
  }

  // 4) 마지막 안전망(프로젝트 공통 더미가 있다면 남겨두세요)
  list.push(
    '/badges/badge_a.png',
    '/badges/badge_b.png',
    '/badges/badge_c.png'
  );

  // 중복 제거
  return Array.from(new Set(list.filter(Boolean)));
};

/* ---------- 배지 비주얼 (무한 로드 방지 + 폴백) ---------- */
const BadgeVisual = ({ badge }) => {
  const candidates = useMemo(() => buildBadgeImageCandidates(badge), [badge]);
  const [idx, setIdx] = useState(0);

  const outOfCandidates = idx >= candidates.length;
  const src = outOfCandidates ? null : candidates[idx];

  return (
    <div className="badge-icon-container" data-rarity={badge.rarity}>
      {!outOfCandidates && src ? (
        <img
          key={src}
          src={src}
          alt={badge.name}
          className="badge-core-img"
          loading="lazy"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
          onError={() => setIdx((i) => i + 1)}
        />
      ) : (
        <span className="badge-fallback" aria-hidden="true">
          {norm(badge?.name).slice(0, 1) || '🏅'}
        </span>
      )}
    </div>
  );
};

/* 등급 배지를 ‘가짜 배지’ 객체로 만들어서 BadgeVisual에 그대로 사용 */
const makeLevelBadge = (levelNameRaw) => {
  const levelName = norm(levelNameRaw || 'BRONZE');
  const n = {
    badgeId: `level-${levelName}`,
    name: `${levelName} 등급`,
    description: '대표 뱃지 미장착 시 노출되는 등급 배지',
    category: 'LEVEL',
    owned: true,
    imageUrl: null,
    levelName,      // 후보 이미지 빌더가 이 값을 사용
    level: levelName
  };
  n.rarity = computeRarity({ name: levelName }); // 링 효과도 등급에 맞게
  return n;
};

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

        // 서버가 여러 개 보내도 화면은 1개만 유지
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

  /* 대표 없을 때 보여줄 등급 배지 */
  const levelNameUpper = norm(level?.levelName ?? user?.level ?? user?.userLevel ?? 'BRONZE');
  const levelFallbackBadge = useMemo(() => makeLevelBadge(levelNameUpper), [levelNameUpper]);

  /* 항상 1개만 대표로 유지 */
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

      {/* 대표 뱃지: 가운데 1개 (없으면 등급 배지) */}
      <div className="badge-section">
        <h3>대표 뱃지</h3>

        <div className="featured-grid">
          <div
            className="badge-item featured"
            data-rarity={(hasFeatured ? theFeatured : levelFallbackBadge).rarity}
          >
            <BadgeVisual badge={hasFeatured ? theFeatured : levelFallbackBadge} />
            <div className="badge-name" title={hasFeatured ? theFeatured.name : levelFallbackBadge.name}>
              {hasFeatured ? theFeatured.name : levelFallbackBadge.name}
            </div>

            {hasFeatured ? (
              <button className="equip-button danger" onClick={() => handleToggleFeatured(theFeatured)}>
                대표 뱃지 해제
              </button>
            ) : null}
          </div>
        </div>
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
                <div
                  key={badge.badgeId}
                  className={`badge-item ${isFeatured ? 'featured' : ''} ${badge.owned ? '' : 'not-owned'}`}
                  data-rarity={badge.rarity}
                >
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
