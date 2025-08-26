// src/pages/BadgeGuide.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../css/BadgeGuide.css';

/* ===== 유틸 ===== */
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
  typeof c === 'string' && /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(c?.trim?.() ?? '') ? c.trim() : null;

/* 문자열 정규화(공백/대소문자 안전) */
const norm = (s) => String(s ?? '').trim().toUpperCase();

/* 기본 색상 */
const CATEGORY_DEFAULT = {
  CREATION:   '#4CAF50',
  ENGAGEMENT: '#E91E63',
  ACHIEVEMENT:'#FFD54F',
  MILESTONE:  '#FFD700',
  COMMUNITY:  '#32CD32',
  SPECIAL:    '#9C27B0',
  EVENT:      '#1E90FF',
  ACTIVITY:   '#8A2BE2',
  OTHER:      '#8ab0d1',
};

/* 폴백 이모지 */
const CATEGORY_EMOJI = {
  CREATION:   '💻',
  ENGAGEMENT: '💬',
  ACHIEVEMENT:'🏆',
  MILESTONE:  '🚩',
  COMMUNITY:  '👥',
  ACTIVITY:   '⚡',
  SPECIAL:    '✨',
  EVENT:      '🎉',
  OTHER:      '⭐',
};

/* 아이콘 후보(채움/두툼 계열) */
const ICON_POOLS = {
  CREATION:   ['solar:code-square-bold-duotone','ph:code-bold','material-symbols:laptop','mdi:laptop'],
  ENGAGEMENT: ['solar:chat-round-like-bold-duotone','ph:chat-circle-dots-bold','mdi:message-badge'],
  ACHIEVEMENT:['solar:trophy-bold-duotone','ph:trophy-bold','mdi:trophy'],
  MILESTONE:  ['solar:flag-bold-duotone','ph:flag-banner-bold','mdi:flag'],
  COMMUNITY:  ['solar:users-group-rounded-bold-duotone','ph:users-three-bold','mdi:account-group'],
  ACTIVITY:   ['solar:activity-bold-duotone','ph:lightning-bold','mdi:lightning-bolt'],
  SPECIAL:    ['solar:sparkles-bold-duotone','ph:sparkle-bold','mdi:sparkles'],
  EVENT:      ['solar:calendar-bold-duotone','ph:ticket-bold','mdi:ticket-confirmation'],
  OTHER:      ['solar:star-bold-duotone','ph:star-four-bold','mdi:star'],
};

const hashStr = (s) => {
  const str = String(s ?? '');
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
};
const pickNames = (category, seed) => {
  const pool = ICON_POOLS[category] || ICON_POOLS.OTHER;
  const start = pool.length ? hashStr(seed) % pool.length : 0;
  return [0,1,2].map(i => pool[(start + i) % pool.length]);
};

const iconUrl = (iconName, color, size = 64) => {
  const qs = new URLSearchParams();
  qs.set('height', String(size));
  if (color) qs.set('color', color.replace('#','%23'));
  qs.set('stroke', '1.6');
  return `https://api.iconify.design/${iconName}.svg?${qs.toString()}`;
};

const computeRarity = (b) => {
  const name = norm(b.name);
  const rc = Number(b.required_count ?? b.requiredCount ?? b.goal ?? 0) || 0;
  const pts = Number(b.points_reward ?? b.pointsReward ?? 0) || 0;
  const explicit = b.isRare === true || /LEGEND|GRANDMASTER|DIAMOND|10000|365/.test(name);
  if (explicit || rc >= 1000 || pts >= 1000) return 'legendary';
  if (rc >= 500   || /MASTER|5000|LOGIN_STREAK_365/.test(name) || pts >= 500) return 'epic';
  if (rc >= 100   || /PLATINUM|100\b/.test(name) || pts >= 200) return 'rare';
  if (rc >= 25    || /GOLD|25\b/.test(name) || pts >= 50)       return 'uncommon';
  return 'common';
};

const normalizeBadge = (b, idx = 0) => {
  const category = norm(b?.category ?? b?.badgeCategory ?? b?.type ?? 'OTHER');
  const name = b?.name ?? b?.title ?? b?.badgeName ?? '이름 없음';
  const color = sanitizeHex(b?.color ?? b?.hexColor) || CATEGORY_DEFAULT[category] || CATEGORY_DEFAULT.OTHER;

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
    emoji: (b?.icon ?? CATEGORY_EMOJI[category] ?? '✨'),
    color,
  };
  n.rarity = computeRarity({ ...b, ...n });
  n.iconCandidates = pickNames(n.category, n.name || n.badgeId);
  return n;
};

/* 외부 아이콘(실패 시 이모지 폴백) */
const IconifyWithSureFallback = ({ badge, size = 64, useIconify = true }) => {
  const [idx, setIdx] = useState(0);
  const [imgOk, setImgOk] = useState(false);
  const names = badge.iconCandidates || [];
  const hasMore = idx < names.length;
  const src = hasMore ? iconUrl(names[idx], badge.color, size) : null;

  return (
    <div className="icon-layer">
      <span className="badge-emoji" style={{ opacity: imgOk ? 0 : 1 }} aria-hidden="true">
        {badge.emoji}
      </span>
      {useIconify && hasMore && (
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          className="iconify-img"
          style={{ opacity: imgOk ? 1 : 0 }}
          onLoad={() => setImgOk(true)}
          onError={() => setIdx(i => i + 1)}
        />
      )}
    </div>
  );
};

/* ===== 메인 컴포넌트 ===== */
function BadgeGuide() {
  const { getAuthHeaders } = useAuth();

  const [badges, setBadges] = useState([]);
  const [userBadges, setUserBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const categories = [
    { value: 'ALL',        label: '전체' },
    { value: 'CREATION',   label: '창작' },
    { value: 'ENGAGEMENT', label: '참여' },
    { value: 'ACHIEVEMENT',label: '업적' },
    { value: 'MILESTONE',  label: '이정표' },
    { value: 'COMMUNITY',  label: '커뮤니티' },
    { value: 'SPECIAL',    label: '특별' },
    { value: 'EVENT',      label: '이벤트' },
    { value: 'ACTIVITY',   label: '활동' },
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
        const rawBadges = extractArray(jsonAll);
        const normalized = rawBadges.map((b, i) => normalizeBadge(b, i));
        setBadges(normalized);

        const resMine = await fetch('/api/badges/my', {
          headers: getAuthHeaders(),
          credentials: 'include',
        });
        if (resMine.ok) {
          const jsonMine = await parseJsonSafe(resMine);
          const mine = extractArray(jsonMine).map((b, i) => normalizeBadge(b, i, true));
          setUserBadges(mine);
        } else {
          setUserBadges([]);
        }
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

  const filteredBadges = useMemo(() => {
    if (norm(selectedCategory) === 'ALL') return badges;
    const target = norm(selectedCategory);
    return badges.filter((b) => norm(b.category) === target);
  }, [badges, selectedCategory]);

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

  const categoryKorean = (cat) => ({
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

        <div className="filter-section">
          <h3>카테고리별 필터</h3>
          <div className="category-filters">
            {categories.map((c) => (
              <button
                key={c.value}
                type="button" /* ✅ 폼 submit 방지 */
                onClick={(e) => { e.preventDefault(); setSelectedCategory(c.value); }}
                className={`category-filter ${norm(selectedCategory) === norm(c.value) ? 'active' : ''}`}
                aria-pressed={norm(selectedCategory) === norm(c.value)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="badges-grid">
          {filteredBadges.map((badge) => {
            const owned = isOwned(badge.badgeId);
            const progress = getProgressInfo(badge);

            return (
              <div
                key={badge.badgeId}
                className={`badge-card ${owned ? 'owned' : 'not-owned'}`}
                style={{ '--accent': badge.color }}
                data-rarity={badge.rarity}
              >
                <div className="badge-image">
                  <div className={`badge-icon-container rarity-${badge.rarity}`}>
                    <IconifyWithSureFallback badge={badge} size={64} useIconify />
                  </div>
                  {owned && <div className="owned-badge">✓</div>}
                </div>

                <div className="badge-info">
                  <h4 className="badge-name">{badge.name}</h4>
                  <p className="badge-description">{badge.description}</p>

                  <div className="badge-category">
                    <span className="category-tag use-accent">{categoryKorean(badge.category)}</span>
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
