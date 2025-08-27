import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../css/BadgeGuide.css';

/* =======================
   유틸
   ======================= */
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
const sanitizeHex = (c) =>
  typeof c === 'string' && /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(c?.trim?.() ?? '')
    ? c.trim()
    : null;

/* 문자열 정규화(공백/대소문자 안전) */
const norm = (s) => String(s ?? '').trim().toUpperCase();

/* 카테고리 기본 색 */
const CATEGORY_DEFAULT = {
  CREATION: '#4CAF50',
  ENGAGEMENT: '#E91E63',
  ACHIEVEMENT: '#FFD54F',
  MILESTONE: '#FFD700',
  COMMUNITY: '#32CD32',
  SPECIAL: '#9C27B0',
  EVENT: '#1E90FF',
  ACTIVITY: '#8A2BE2',
  OTHER: '#8ab0d1',
};

/* 폴백 이모지 (아이콘 실패 시) */
const CATEGORY_EMOJI = {
  CREATION: '💻',
  ENGAGEMENT: '💬',
  ACHIEVEMENT: '🏆',
  MILESTONE: '🚩',
  COMMUNITY: '👥',
  ACTIVITY: '⚡',
  SPECIAL: '✨',
  EVENT: '🎉',
  OTHER: '⭐',
};

/* 기존 계산식(문자 희귀도가 없을 때 링 단계 추정에 사용) */
const computeRarityText = (b) => {
  const name = norm(b.name);
  const rc = Number(b.required_count ?? b.requiredCount ?? b.goal ?? 0) || 0;
  const pts = Number(b.points_reward ?? b.pointsReward ?? 0) || 0;
  const explicit = b.isRare === true || /LEGEND|GRANDMASTER|DIAMOND|10000|365/.test(name);
  if (explicit || rc >= 1000 || pts >= 1000) return 'legendary';
  if (rc >= 500 || /MASTER|5000|LOGIN_STREAK_365/.test(name) || pts >= 500) return 'epic';
  if (rc >= 100 || /PLATINUM|100\b/.test(name) || pts >= 200) return 'rare';
  if (rc >= 25 || /GOLD|25\b/.test(name) || pts >= 50) return 'uncommon';
  return 'common';
};

/* ===== 희귀도 매핑 =====
   - letter: S/A/B/C/D/F  (중앙 이미지 선택 & 정렬용)
   - ring:   legendary/epic/rare/uncommon/common  (테두리 이펙트용)
*/
const RARITY_ORDER = ['S', 'A', 'B', 'C', 'D', 'F'];

const RARITY_TO_RING = {
  S: 'legendary',
  A: 'epic',
  B: 'rare',
  C: 'uncommon',
  D: 'common',
  F: 'common',
};

const RARITY_IMG = {
  S: '/badges/badge_s.png',
  A: '/badges/badge_a.png',
  B: '/badges/badge_b.png',
  C: '/badges/badge_c.png',
  D: '/badges/badge_d.png', // 파일이 없다면 만들어 넣어주세요.
  F: '/badges/badge_f.png',
};

/* 문자열/텍스트 희귀도 무엇이 오든 → Letter로 통일 */
const inferRarityLetter = (raw, badgeForFallback) => {
  const c = String(raw ?? '').toUpperCase();
  if (RARITY_ORDER.includes(c)) return c;

  // 'legendary/epic/...' 같은 텍스트를 받은 경우
  const text = c || computeRarityText(badgeForFallback).toUpperCase();
  const map = { LEGENDARY: 'S', EPIC: 'A', RARE: 'B', UNCOMMON: 'C', COMMON: 'D' };
  return map[text] || 'F';
};

/* 뱃지 정규화 */
const normalizeBadge = (b, idx = 0) => {
  const category = norm(b?.category ?? b?.badgeCategory ?? b?.type ?? 'OTHER');
  const name = b?.name ?? b?.title ?? b?.badgeName ?? '이름 없음';
  const color =
    sanitizeHex(b?.color ?? b?.hexColor) || CATEGORY_DEFAULT[category] || CATEGORY_DEFAULT.OTHER;

  const n = {
    badgeId: b?.badgeId ?? b?.id ?? b?.badge_id ?? `badge-${idx}`,
    name,
    description: b?.description ?? b?.desc ?? '',
    category,
    requiredCount: b?.requiredCount ?? b?.requirementCount ?? b?.goal ?? 1,
    requirements: b?.requirements ?? b?.requirementList ?? [],
    rewards: b?.rewards ?? b?.rewardList ?? [],
    currentProgress: b?.currentProgress ?? b?.progress ?? 0,
    owned: b?.owned ?? b?.isOwned ?? false,
    pointsReward: b?.points_reward ?? b?.pointsReward ?? 0,
    emoji: b?.icon ?? CATEGORY_EMOJI[category] ?? '✨',
    color,
  };

  // 희귀도 통합
  n.rarityLetter = inferRarityLetter(b?.rarityLetter ?? b?.tier ?? b?.rank ?? b?.grade ?? b?.rarity, {
    name,
    requiredCount: n.requiredCount,
    pointsReward: n.pointsReward,
  });
  n.ring = RARITY_TO_RING[n.rarityLetter] || 'common';
  n.imgSrc = RARITY_IMG[n.rarityLetter] || RARITY_IMG.F;

  return n;
};

/* =======================
   메인 컴포넌트
   ======================= */
function BadgeGuide() {
  const { getAuthHeaders } = useAuth();

  const [badges, setBadges] = useState([]);
  const [userBadges, setUserBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const categories = [
    { value: 'ALL', label: '전체' },
    { value: 'CREATION', label: '창작' },
    { value: 'ENGAGEMENT', label: '참여' },
    { value: 'ACHIEVEMENT', label: '업적' },
    { value: 'MILESTONE', label: '이정표' },
    { value: 'COMMUNITY', label: '커뮤니티' },
    { value: 'SPECIAL', label: '특별' },
    { value: 'EVENT', label: '이벤트' },
    { value: 'ACTIVITY', label: '활동' },
  ];

  useEffect(() => {
    const fetchBadgesAndUser = async () => {
      try {
        setLoading(true);
        setError(null);

        const resAll = await fetch('/api/badges', {
          headers: getAuthHeaders(),
          credentials: 'include',
        });
        if (!resAll.ok) throw new Error('뱃지 목록 조회 실패');
        const jsonAll = await parseJsonSafe(resAll);
        const normalized = extractArray(jsonAll).map((b, i) => normalizeBadge(b, i));
        setBadges(normalized);

        const resMine = await fetch('/api/badges/my', {
          headers: getAuthHeaders(),
          credentials: 'include',
        });
        const mine = resMine.ok ? extractArray(await parseJsonSafe(resMine)).map((b, i) => normalizeBadge(b, i, true)) : [];
        setUserBadges(mine);
      } catch (err) {
        console.error(err);
        setBadges([]);
        setUserBadges([]);
        setError('뱃지 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchBadgesAndUser();
  }, [getAuthHeaders]);

  // 카테고리 필터
  const filteredBadges = useMemo(() => {
    if (norm(selectedCategory) === 'ALL') return badges;
    const target = norm(selectedCategory);
    return badges.filter((b) => norm(b.category) === target);
  }, [badges, selectedCategory]);

  // 희귀도 정렬 (S → A → B → C → D → F)
  const sortedBadges = useMemo(() => {
    const rank = (r) => RARITY_ORDER.indexOf(String(r || 'F').toUpperCase());
    return filteredBadges.slice().sort((a, b) => rank(a.rarityLetter) - rank(b.rarityLetter));
  }, [filteredBadges]);

  const isOwned = (badgeId) => userBadges.some((ub) => ub.badgeId === badgeId);

  const getProgressInfo = (badge) => {
    const ub = userBadges.find((x) => x.badgeId === badge.badgeId);
    if (!ub) return null;
    const current = ub.currentProgress ?? 0;
    const required = badge.requiredCount || 1;
    return { current, required, percentage: Math.min(100, (current / required) * 100) };
  };

  if (loading) return <div className="loading-message">뱃지 정보를 불러오는 중...</div>;
  if (error) return <div className="error-message">오류: {error}</div>;

  const categoryKorean = (cat) =>
    ({
      ALL: '전체',
      CREATION: '창작',
      ENGAGEMENT: '참여',
      ACHIEVEMENT: '업적',
      MILESTONE: '이정표',
      COMMUNITY: '커뮤니티',
      SPECIAL: '특별',
      EVENT: '이벤트',
      ACTIVITY: '활동',
    }[norm(cat)] || cat);

  return (
    <div className="badge-guide-page modern-badges">
      <div className="container">
        <div className="page-header">
          <h1>뱃지 가이드</h1>
          <p>다양한 활동을 통해 뱃지를 획득하고 성장해보세요!</p>
        </div>

        {/* 통계 */}
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

        {/* 카테고리 필터 */}
        <div className="filter-section">
          <h3>카테고리별 필터</h3>
          <div className="category-filters">
            {categories.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedCategory(c.value);
                }}
                className={`category-filter ${norm(selectedCategory) === norm(c.value) ? 'active' : ''}`}
                aria-pressed={norm(selectedCategory) === norm(c.value)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* 뱃지 목록 (정렬 적용) */}
        <div className="badges-grid">
          {sortedBadges.map((badge) => {
            const owned = isOwned(badge.badgeId);
            const progress = getProgressInfo(badge);

            return (
              <div
                key={badge.badgeId}
                className={`badge-card ${owned ? 'owned' : 'not-owned'}`}
                style={{ '--accent': badge.color }}
                data-rarity={badge.ring} // ← 테두리 이펙트 유지
              >
                <div className="badge-image">
                  <div className="badge-icon-container">
                    <img
                      className="rarity-coin"
                      src={badge.imgSrc}
                      alt={badge.rarityLetter}
                      width={64}
                      height={64}
                    />
                  </div>
                  {owned && <div className="owned-badge">✓</div>}
                </div>

                <div className="badge-info">
                  <h4 className="badge-name">{badge.name}</h4>
                  <p className="badge-description">{badge.description}</p>

                  <div className="badge-category">
                    <span className="category-tag use-accent">
                      {categoryKorean(badge.category)}
                    </span>
                  </div>

                  {badge.requiredCount > 1 && (
                    <div className="progress-section">
                      {progress ? (
                        <>
                          <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${progress.percentage}%` }} />
                          </div>
                          <div className="progress-text">
                            {progress.current} / {progress.required}
                          </div>
                        </>
                      ) : (
                        <div className="progress-text">0 / {badge.requiredCount}</div>
                      )}
                    </div>
                  )}

                  {(badge.requirements?.length ?? 0) > 0 && (
                    <div className="badge-requirements">
                      <h5>획득 조건:</h5>
                      <ul>
                        {badge.requirements.map((req, i) => (
                          <li key={i}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(badge.rewards?.length ?? 0) > 0 && (
                    <div className="badge-rewards">
                      <h5>보상:</h5>
                      <ul>
                        {badge.rewards.map((rw, i) => (
                          <li key={i}>{rw}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {sortedBadges.length === 0 && (
          <div className="no-badges">
            <p>해당 카테고리의 뱃지가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default BadgeGuide;
