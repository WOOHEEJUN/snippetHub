// src/utils/badgeUtils.js

const norm = (s) => String(s ?? '').trim().toUpperCase();

/* ===== 희귀도 계산(휘장 색/속도에 사용) ===== */
export function getBadgeRarity(badge) {
  const name = norm(badge?.name);
  const rc = Number(badge?.required_count ?? badge?.requiredCount ?? badge?.goal ?? 0) || 0;
  const pts = Number(badge?.points_reward ?? badge?.pointsReward ?? 0) || 0;
  const explicit = badge?.isRare === true || /LEGEND|GRANDMASTER|DIAMOND|10000|365/.test(name);
  if (explicit || rc >= 1000 || pts >= 1000) return 'legendary';
  if (rc >= 500   || /MASTER|5000|LOGIN_STREAK_365/.test(name) || pts >= 500) return 'epic';
  if (rc >= 100   || /PLATINUM|100\b/.test(name) || pts >= 200) return 'rare';
  if (rc >= 25    || /GOLD|25\b/.test(name) || pts >= 50)       return 'uncommon';
  return 'common';
}

/* ===== 티어(S/A/B/C/D/F) 추론 → 코어 PNG 경로 ===== */
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

export function getRepresentativeBadgeImage(badgeLike) {
  if (!badgeLike) return '/badges/badge_f.png';
  const direct = String(badgeLike?.tier ?? badgeLike?.grade ?? '').trim().toLowerCase();
  const hinted = tierHintFromName(badgeLike?.name ?? '');
  const rarityToTier = { legendary: 's', epic: 'a', rare: 'b', uncommon: 'c', common: 'd' };
  const viaRarity = rarityToTier[(badgeLike?.rarity ?? '').toLowerCase()] || rarityToTier[getBadgeRarity(badgeLike)];
  const t = ['s','a','b','c','d','f'].includes(direct) ? direct : (hinted || viaRarity || 'f');
  return `/badges/badge_${t}.png`;
}

/* ===== 레벨 뱃지(대표뱃지 없을 때 사용) =====
   파일은 /public/badges/bronze.png, silver.png, ... 형태라고 가정 */
export function getLevelBadgeImage(level) {
  if (!level) return '';
  const map = {
    BRONZE: 'bronze.png',
    SILVER: 'silver.png',
    GOLD: 'gold.png',
    PLATINUM: 'platinum.png',
    DIAMOND: 'diamond.png',
    MASTER: 'master.png',
    GRANDMASTER: 'grandmaster.png',
    LEGEND: 'legend.png',
  };
  const key = norm(level);
  const img = map[key];
  return img ? `/badges/${img}` : '';
}

/* 다양한 사용자 객체에서 level 값을 꺼내기 위한 헬퍼 */
export function getUserLevel(user) {
  return (
    user?.level ??
    user?.grade ??
    user?.data?.level ??
    user?.profile?.level ??
    user?.user?.level ??
    null
  );
}
