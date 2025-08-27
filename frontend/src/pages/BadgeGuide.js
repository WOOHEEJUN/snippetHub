// src/pages/BadgeGuide.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../css/BadgeGuide.css';

/* ===== 설정: 서버 필터를 쓰고 싶으면 true 로 ===== */
const SERVER_FILTER = false;

/* ===== 공용 유틸 ===== */
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
const norm = (s) => String(s ?? '').trim().toUpperCase();

/* 카테고리 기본 색 */
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

/* 희귀도 계산 */
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

/* 응답 정규화 */
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
    currentProgress: b?.currentProgress ?? b?.progress ?? 0,
    requirements: b?.requirements ?? b?.requirementList ?? [],
    rewards: b?.rewards ?? b?.rewardList ?? [],
    pointsReward: b?.points_reward ?? b?.pointsReward ?? 0,
    owned: b?.owned ?? b?.isOwned ?? false,
    color,
  };
  n.rarity = computeRarity({ ...b, ...n });
  return n;
};

/* 희귀도 → 파일 접미사(S>A>B>C>D>F) + 정렬 우선순위 */
const rarityToTier = { legendary: 's', epic: 'a', rare: 'b', uncommon: 'c', common: 'd' };
const rarityRank = (r) => ({ legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 }[r] ?? 5);
const sortByRarityDesc = (arr) =>
  [...arr].sort((a, b) => rarityRank(a.rarity) - rarityRank(b.rarity) || a.name.localeCompare(b.name));

/* 중앙 PNG 뱃지 */
const CenterBadge = ({ rarity, alt }) => {
  const tier = rarityToTier[rarity] || 'f';
  const src = `/badges/badge_${tier}.png`;
  return (
    <div className={`badge-icon-container rarity-${rarity}`}>
      <img
        src={src}
        alt={alt}
        className="badge-core-img"
        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/badges/badge_f.png'; }}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%,-50%)',
          width: '66%',
          height: '66%',
          objectFit: 'contain',
          pointerEvents: 'none',
          userSelect: 'none'
        }}
      />
    </div>
  );
};

/* 카테고리 한글 매핑 */
const categoryLabel = (cat) => ({
  ALL: '전체',
  CREATION: '창작',
  ENGAGEMENT: '참여',
  ACHIEVEMENT: '업적',
  MILESTONE: '이정표',
  COMMUNITY: '커뮤니티',
  SPECIAL: '특별',
  EVENT: '이벤트',
  ACTIVITY: '활동',
  OTHER: '기타',
}[norm(cat)] || cat);

/* 버튼 표시는 이 순서로 정렬 */
const CATEGORY_ORDER = ['CREATION','ENGAGEMENT','ACHIEVEMENT','MILESTONE','COMMUNITY','SPECIAL','EVENT','ACTIVITY','OTHER'];

function BadgeGuide() {
  const { getAuthHeaders } = useAuth();

  const [badges, setBadges] = useState([]);
  const [userBadges, setUserBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  /* ===== 데이터 로딩 ===== */
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);

        // 전체 목록 (또는 선택 카테고리 서버 필터)
        const listUrl = SERVER_FILTER && norm(selectedCategory) !== 'ALL'
          ? `/api/badges?category=${encodeURIComponent(selectedCategory)}`
          : '/api/badges';

        const resAll = await fetch(listUrl, {
          headers: getAuthHeaders(),
          credentials: 'include',
          cache: 'no-store',
        });
        if (!resAll.ok) throw new Error('뱃지 목록 조회 실패');
        const jsonAll = await parseJsonSafe(resAll);
        const normalized = extractArray(jsonAll).map((b, i) => normalizeBadge(b, i));
        setBadges(sortByRarityDesc(normalized));

        // 내 뱃지
        const resMine = await fetch('/api/badges/my', {
          headers: getAuthHeaders(),
          credentials: 'include',
          cache: 'no-store',
        });
        if (resMine.ok) {
          const jsonMine = await parseJsonSafe(resMine);
          const mine = extractArray(jsonMine).map((b, i) => normalizeBadge(b, i));
          setUserBadges(sortByRarityDesc(mine));
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
    fetchAll();
    // 서버 필터를 켜면 카테고리 바뀔 때마다 API 재호출
  }, [getAuthHeaders, selectedCategory]);

  /* ===== 동적 카테고리: 데이터에 실제 있는 것만 버튼으로 ===== */
  const categoriesFromData = useMemo(() => {
    const set = new Set();
    badges.forEach(b => set.add(norm(b.category || 'OTHER')));
    // 순서 기준으로 소팅 + ALL 맨 앞
    const ordered = CATEGORY_ORDER.filter(c => set.has(c));
    return ['ALL', ...ordered, ...[...set].filter(c => !CATEGORY_ORDER.includes(c) && c !== 'ALL')];
  }, [badges]);

  /* ===== 클라이언트 필터 (SERVER_FILTER=false일 때 동작) ===== */
  const filteredBadges = useMemo(() => {
    if (SERVER_FILTER || norm(selectedCategory) === 'ALL') return badges;
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
            <div className="stats-label">현재 목록</div>
          </div>
          <div className="stats-card">
            <div className="stats-number">
              {badges.length ? Math.round((userBadges.length / badges.length) * 100) : 0}%
            </div>
            <div className="stats-label">달성률</div>
          </div>
        </div>

        {/* 동적 카테고리 버튼 */}
        <div className="filter-section">
          <h3>카테고리별 필터</h3>
          <div className="category-filters">
            {categoriesFromData.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`category-filter ${norm(selectedCategory) === norm(cat) ? 'active' : ''}`}
                aria-pressed={norm(selectedCategory) === norm(cat)}
              >
                {categoryLabel(cat)}
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
                  {/* 중앙 PNG + 희귀도 오라 */}
                  <CenterBadge rarity={badge.rarity} alt={badge.name} />
                  {owned && <div className="owned-badge">✓</div>}
                </div>

                <div className="badge-info">
                  <h4 className="badge-name">{badge.name}</h4>
                  <p className="badge-description">{badge.description}</p>

                  <div className="badge-category">
                    <span className="category-tag use-accent">{categoryLabel(badge.category)}</span>
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
                        {badge.requirements.map((req, i) => <li key={i}>{req}</li>)}
                      </ul>
                    </div>
                  )}

                  {(badge.rewards?.length ?? 0) > 0 && (
                    <div className="badge-rewards">
                      <h5>보상:</h5>
                      <ul>
                        {badge.rewards.map((rw, i) => <li key={i}>{rw}</li>)}
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
