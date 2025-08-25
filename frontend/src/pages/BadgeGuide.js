import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import '../css/BadgeGuide.css';

/** ============ 유틸 ============ */

/** 안전 JSON 파서 */
const parseJsonSafe = async (res) => {
  try {
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) return await res.json();
  } catch (_) {}
  return null;
};

/** 여러 응답 스키마에서 배열 뽑기 */
const extractArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data?.content)) return data.data.content;
  return [];
};

/** hex 색상 유효성 검사 */
const sanitizeHex = (c) =>
  typeof c === 'string' && /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(c.trim()) ? c.trim() : null;

/** 카테고리 기본 색 (DB color 폴백) */
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

/** 카테고리 기본 이모지 (외부 아이콘 실패 시 폴백) */
const CATEGORY_EMOJI = {
  CREATION:   '💻',
  ENGAGEMENT: '❤️',
  ACHIEVEMENT:'🏆',
  MILESTONE:  '🚩',
  COMMUNITY:  '👥',
  ACTIVITY:   '⚗️',
  SPECIAL:    '✨',
  EVENT:      '🎟️',
  OTHER:      '⭐',
};

/** Lucide 아이콘 풀 (Iconify prefix는 'lucide') */
const ICONIFY_POOLS = {
  CREATION:   ['lucide:code', 'lucide:terminal', 'lucide:file-code-2', 'lucide:pen-tool', 'lucide:palette'],
  ENGAGEMENT: ['lucide:heart', 'lucide:message-circle', 'lucide:messages-square', 'lucide:thumbs-up', 'lucide:user-plus'],
  ACHIEVEMENT:['lucide:trophy', 'lucide:medal', 'lucide:award', 'lucide:gem', 'lucide:crown'],
  MILESTONE:  ['lucide:flag', 'lucide:route', 'lucide:map', 'lucide:flag-triangle-right', 'lucide:milestone'],
  COMMUNITY:  ['lucide:users', 'lucide:user-plus', 'lucide:messages-square', 'lucide:megaphone'],
  ACTIVITY:   ['lucide:activity', 'lucide:flask-conical', 'lucide:beaker', 'lucide:lab-flask'],
  SPECIAL:    ['lucide:sparkles', 'lucide:wand-2', 'lucide:stars', 'lucide:gem'],
  EVENT:      ['lucide:calendar', 'lucide:calendar-clock', 'lucide:ticket', 'lucide:gift'],
  OTHER:      ['lucide:star'],
};

/** 간단 해시(안정적 랜덤 선택) */
const hashStr = (s) => {
  let h = 2166136261 >>> 0; // FNV-1a
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

/** 카테고리/시드 기반 외부 아이콘 이름 선택 */
const pickIconifyName = (category, seed) => {
  const pool = ICONIFY_POOLS[category] || ICONIFY_POOLS.OTHER;
  const idx = pool.length ? hashStr(seed) % pool.length : 0;
  return pool[idx] || 'lucide:star';
};

/** Iconify SVG URL 생성 (height + color 적용) */
const iconifyUrl = (iconName, color, size = 56) => {
  const safeColor = color ? encodeURIComponent(color) : '';
  const qs = new URLSearchParams();
  qs.set('height', String(size));
  if (safeColor) qs.set('color', safeColor.replace(/%23/gi, '%23')); // # -> %23
  return `https://api.iconify.design/${iconName}.svg?${qs.toString()}`; // /{prefix}/{name}.svg?height=&color=
};

/** 희귀도 계산: common / uncommon / rare / epic / legendary */
const computeRarity = (b) => {
  const name = (b.name ?? '').toUpperCase();
  const rc = Number(b.required_count ?? b.requiredCount ?? b.goal ?? 0) || 0;
  const pts = Number(b.points_reward ?? b.pointsReward ?? 0) || 0;
  const explicitRare =
    b.isRare === true || /LEGEND|GRANDMASTER|DIAMOND|10000|365/.test(name);

  if (explicitRare || rc >= 1000 || pts >= 1000) return 'legendary';
  if (rc >= 500   || /MASTER|5000|LOGIN_STREAK_365/.test(name) || pts >= 500) return 'epic';
  if (rc >= 100   || /PLATINUM|100\b/.test(name) || pts >= 200) return 'rare';
  if (rc >= 25    || /GOLD|25\b/.test(name) || pts >= 50)       return 'uncommon';
  return 'common';
};

/** ============ 정규화 ============ */
const normalizeBadge = (b, idx = 0) => {
  const category = (b.category ?? b.badgeCategory ?? b.type ?? 'OTHER').toString().toUpperCase();
  const name = b.name ?? b.title ?? b.badgeName ?? '이름 없음';

  const rawColor = b.color ?? b.hexColor ?? null;
  const color = sanitizeHex(rawColor) || CATEGORY_DEFAULT[category] || CATEGORY_DEFAULT.OTHER;

  const normalized = {
    badgeId: b.badgeId ?? b.id ?? b.badge_id ?? `badge-${idx}`,
    name,
    description: b.description ?? b.desc ?? '',
    category,
    requiredCount: b.requiredCount ?? b.requirementCount ?? b.goal ?? 1,
    requirements: b.requirements ?? b.requirementList ?? [],
    rewards: b.rewards ?? b.rewardList ?? [],
    currentProgress: b.currentProgress ?? b.progress ?? 0,
    owned: b.owned ?? b.isOwned ?? false,
    pointsReward: b.points_reward ?? b.pointsReward ?? 0,
    emoji: (b.icon ?? CATEGORY_EMOJI[category] ?? '✨'), // 폴백 이모지
    color,
  };

  normalized.rarity = computeRarity({ ...b, ...normalized });
  normalized.iconifyName = pickIconifyName(normalized.category, normalized.name || normalized.badgeId);
  normalized.iconifyUrl = iconifyUrl(normalized.iconifyName, normalized.color, 56);
  return normalized;
};

/** ============ 본 컴포넌트 ============ */
function BadgeGuide() {
  const { getAuthHeaders } = useAuth();

  const [badges, setBadges] = useState([]);
  const [userBadges, setUserBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // 외부 아이콘 실패 시 폴백 이모지 표시용
  const [iconFail, setIconFail] = useState({}); // { [badgeId]: true }
  const markIconFail = useCallback((id) => setIconFail((p) => ({ ...p, [id]: true })), []);

  // 로딩 애니메이션 제어(선택)
  const [loaded, setLoaded] = useState({});
  const markLoaded = useCallback((id) => setLoaded((p) => ({ ...p, [id]: true })), []);

  const categories = [
    { value: 'ALL',        label: '전체' },
    { value: 'CREATION',   label: '창작' },
    { value: 'ENGAGEMENT', label: '참여' },
    { value: 'ACHIEVEMENT',label: '업적' },
    { value: 'MILESTONE',  label: '이정표' },
    { value: 'COMMUNITY',  label: '커뮤니티' },
    { value: 'SPECIAL',    label: '특별' },
    { value: 'EVENT',      label: '이벤트' },
    { value: 'ACTIVITY',   label: '활동' }, // 과거 호환
  ];

  useEffect(() => {
    const fetchBadgesAndUser = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1) 전체 뱃지
        const resAll = await fetch('/api/badges', {
          headers: getAuthHeaders(),
          credentials: 'include',
        });
        if (!resAll.ok) throw new Error('뱃지 목록 조회 실패');
        const jsonAll = await parseJsonSafe(resAll);
        const rawBadges = extractArray(jsonAll);
        const normalized = rawBadges.map((b, i) => normalizeBadge(b, i));
        setBadges(normalized);

        // 2) 내 뱃지
        const resMine = await fetch('/api/badges/my', {
          headers: getAuthHeaders(),
          credentials: 'include',
        });
        if (resMine.ok) {
          const jsonMine = await parseJsonSafe(resMine);
          const mine = extractArray(jsonMine).map((b, i) => normalizeBadge(b, i));
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

  /** 필터 */
  const filteredBadges = useMemo(() => {
    if (selectedCategory === 'ALL') return badges;
    const target = selectedCategory.toUpperCase();
    return badges.filter((b) => (b.category || '').toUpperCase() === target);
  }, [badges, selectedCategory]);

  /** 보유 여부 */
  const isOwned = (badgeId) => userBadges.some((ub) => ub.badgeId === badgeId);

  /** 진행도 */
  const getProgressInfo = (badge) => {
    const ub = userBadges.find((x) => x.badgeId === badge.badgeId);
    if (!ub) return null;
    const current = ub.currentProgress ?? 0;
    const required = badge.requiredCount || 1;
    return {
      current,
      required,
      percentage: Math.min(100, (current / required) * 100),
    };
  };

  if (loading) return <div className="loading-message">뱃지 정보를 불러오는 중...</div>;
  if (error) return <div className="error-message">오류: {error}</div>;

  /** 카테고리 한글 표기 */
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
  }[String(cat || '').toUpperCase()] || cat);

  return (
    <div className="badge-guide-page">
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
                onClick={() => setSelectedCategory(c.value)}
                className={`category-filter ${selectedCategory === c.value ? 'active' : ''}`}
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
                  <div
                    className={`badge-icon-container rarity-${badge.rarity} ${loaded[badge.badgeId] ? 'ready' : 'loading'}`}
                    onAnimationEnd={() => markLoaded(badge.badgeId)}
                  >
                    {/* 살짝 빛나는 원판 */}
                    <div className="emoji-plate" aria-hidden="true" />
                    {/* 외부 SVG 아이콘 (Iconify) */}
                    {!iconFail[badge.badgeId] ? (
                      <img
                        src={badge.iconifyUrl}
                        alt=""
                        width={56}
                        height={56}
                        loading="lazy"
                        className="iconify-img"
                        style={{ display: 'block', margin: '0 auto', position: 'relative', zIndex: 2 }}
                        onError={() => markIconFail(badge.badgeId)}
                      />
                    ) : (
                      // 네트워크 실패 시 폴백: 중앙 이모지
                      <span className="badge-emoji" aria-hidden="true">{badge.emoji}</span>
                    )}
                  </div>
                  {owned && <div className="owned-badge">✓</div>}
                </div>

                <div className="badge-info">
                  <h4 className={`badge-name ${badge.rarity === 'epic' ? 'rarity-title-epic' : ''} ${badge.rarity === 'legendary' ? 'rarity-title-legendary' : ''}`}>
                    {badge.name}
                  </h4>
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
