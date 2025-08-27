// src/pages/BadgeGuide.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../css/BadgeGuide.css';

/* ===== 옵션 ===== */
const SERVER_FILTER = false;     // true면 카테고리 바뀔 때 서버에 쿼리
const DEBUG = false;

/* ===== 카테고리 표시 순서 & 라벨 ===== */
const CATEGORY_ORDER = ['CREATION','ENGAGEMENT','ACHIEVEMENT','MILESTONE','COMMUNITY','SPECIAL','EVENT','ACTIVITY'];
const categoryLabel = (cat) => ({
  ALL:'전체', CREATION:'창작', ENGAGEMENT:'참여', ACHIEVEMENT:'업적', MILESTONE:'이정표',
  COMMUNITY:'커뮤니티', SPECIAL:'특별', EVENT:'이벤트', ACTIVITY:'활동', OTHER:'기타',
}[cat] || cat);

/* ===== 공용 fetch ===== */
const fetchJsonReport = async (url, options) => {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = new Error('HTTP error');
    err.status = res.status;
    throw err;
  }
  return res.json();
};

/* ===== 유틸 ===== */
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

/* 기본 색상(없을 때 액센트용) */
const CATEGORY_DEFAULT = {
  CREATION:'#4CAF50', ENGAGEMENT:'#E91E63', ACHIEVEMENT:'#FFD54F', MILESTONE:'#FFD700',
  COMMUNITY:'#32CD32', SPECIAL:'#9C27B0', EVENT:'#1E90FF', ACTIVITY:'#8A2BE2', OTHER:'#8ab0d1',
};

/* =========================================================
   희귀도 계산 (더 빡세게)
   - rc: 요구 횟수 / pts: 포인트 보상
   - 아래 임계치 중 하나라도 만족하면 상위 희귀도로 승급
   - 이름 키워드도 힌트로 사용
   ========================================================= */
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
  return 'common'; // 가장 쉬운 구간 (D/F는 아래 티어에서 분기)
};

/* ===== 티어(S/A/B/C/D/F) 계산 (더 빡세게) ===== */
// rarity -> 기본 티어 매핑 (fallback)
const RARITY_TO_TIER = { legendary:'s', epic:'a', rare:'b', uncommon:'c', common:'d' };

// 이름 안에 S/A/B/C/D/F 단서가 있으면 우선 사용
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

// 최종 티어: 1) 직접(tier/grade) 2) 강화된 수치/키워드 3) 이름 힌트 4) rarity 매핑 5) F
const computeTierLetter = (b) => {
  const direct = (b?.tier ?? b?.grade ?? '').toString().trim().toLowerCase();
  if (['s','a','b','c','d','f'].includes(direct)) return direct;

  const name = norm(b?.name ?? '');
  const rc = Number(b?.required_count ?? b?.requiredCount ?? b?.goal ?? 0) || 0;
  const pts = Number(b?.points_reward  ?? b?.pointsReward ?? 0) || 0;

  // 강화 임계치 (C부터 확실히 어렵게)
  if (/LEGEND|GRANDMASTER|DIAMOND|MYTHIC|GOD/.test(name) || rc >= 2000 || pts >= 2000) return 's';
  if (/MASTER|PLATINUM|TOP_?100|STREAK_?180/.test(name) || rc >= 1000 || pts >= 1200) return 'a';
  if (/GOLD|500\b|STREAK_?120/.test(name)      || rc >= 400  || pts >= 600 ) return 'b';
  if (/SILVER|100\b|STREAK_?60/.test(name)     || rc >= 150  || pts >= 250 ) return 'c';
  if (/BRONZE|25\b|STREAK_?14/.test(name)      || rc >= 40   || pts >= 80  ) return 'd';

  const hinted = tierHintFromName(b?.name ?? '');
  if (hinted) return hinted;

  const viaRarity = RARITY_TO_TIER[(b?.rarity ?? '').toLowerCase()];
  return viaRarity || 'f'; // 나머지는 전부 F
};

/* ===== 정규화 ===== */
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
  n.tierLetter = computeTierLetter({ ...b, ...n });
  return n;
};

/* ===== 정렬: S→A→B→C→D→F ===== */
const TIER_ORDER = { s:0, a:1, b:2, c:3, d:4, f:5 };
const sortByTierDesc = (arr) =>
  [...arr].sort((a, b) =>
    (TIER_ORDER[a.tierLetter] ?? 99) - (TIER_ORDER[b.tierLetter] ?? 99) ||
    a.name.localeCompare(b.name)
  );

/* ===== 중앙 PNG 출력 ===== */
const badgePngSrc = (t) => `/badges/badge_${t || 'f'}.png`;
const CenterBadge = ({ tier = 'f', alt }) => (
  <div className="badge-icon-container">
    <img
      src={badgePngSrc(tier)}
      alt={alt}
      className="badge-core-img"
      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/badges/badge_f.png'; }}
      style={{
        position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)',
        width:'66%', height:'66%', objectFit:'contain', pointerEvents:'none', userSelect:'none'
      }}
    />
  </div>
);

/* ===== 메인 컴포넌트 ===== */
function BadgeGuide() {
  const { getAuthHeaders } = useAuth();

  const [badges, setBadges] = useState([]);
  const [userBadges, setUserBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const listUrl =
          SERVER_FILTER && norm(selectedCategory) !== 'ALL'
            ? `/api/badges?category=${encodeURIComponent(selectedCategory)}`
            : '/api/badges';

        const all = await fetchJsonReport(listUrl, {
          headers: getAuthHeaders(),
          credentials: 'include',
          cache: 'no-store',
        });
        const rawList = extractArray(all?.data ?? all);
        const normalized = rawList.map((b, i) => normalizeBadge(b, i));
        if (!cancelled) setBadges(sortByTierDesc(normalized));

        const mine = await fetchJsonReport('/api/badges/my', {
          headers: getAuthHeaders(),
          credentials: 'include',
          cache: 'no-store',
        });
        const rawMine = extractArray(mine?.data ?? mine);
        const normalizedMine = rawMine.map((b, i) => normalizeBadge(b, i));
        if (!cancelled) setUserBadges(sortByTierDesc(normalizedMine));

        if (DEBUG && !cancelled) {
          if (normalized.length === 0) console.warn('[BadgeGuide] 서버 뱃지 0개');
          if (normalizedMine.length === 0) console.warn('[BadgeGuide] 내 뱃지 0개');
        }
      } catch (e) {
        if (!cancelled) {
          setBadges([]);
          setUserBadges([]);
          setError('뱃지 정보를 불러오는 중 오류가 발생했습니다.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [getAuthHeaders]); // SERVER_FILTER를 true로 쓰면 selectedCategory도 deps에 넣어주세요.

  /* 버튼 목록: 실제 데이터에 존재하는 카테고리만 노출 */
  const categoriesFromData = useMemo(() => {
    const set = new Set();
    badges.forEach(b => set.add(norm(b.category || 'OTHER')));
    const ordered = CATEGORY_ORDER.filter(c => set.has(c));
    return ['ALL', ...ordered, ...[...set].filter(c => !CATEGORY_ORDER.includes(c) && c !== 'ALL')];
  }, [badges]);

  /* 클라 필터 */
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
                  {/* 중앙 PNG는 S/A/B/C/D/F로 표시, 테두리 효과는 rarity로 유지 */}
                  <CenterBadge tier={badge.tierLetter} alt={badge.name} />
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
                      <ul>{badge.requirements.map((req, i) => <li key={i}>{req}</li>)}</ul>
                    </div>
                  )}

                  {(badge.rewards?.length ?? 0) > 0 && (
                    <div className="badge-rewards">
                      <h5>보상:</h5>
                      <ul>{badge.rewards.map((rw, i) => <li key={i}>{rw}</li>)}</ul>
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
            {DEBUG && (
              <p style={{ marginTop: 8, opacity: .7, fontSize: '.9rem' }}>
                디버그: 전체 {badges.length}개 / 선택 카테고리 {selectedCategory}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default BadgeGuide;
