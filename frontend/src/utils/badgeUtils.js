// src/utils/badgeUtils.js

/* ---------------- 공용 유틸 ---------------- */
const norm = (s) => String(s ?? '').trim().toUpperCase();
const isUrlLike = (s) => typeof s === 'string' && /^https?:\/\//i.test(s);
const looksLikeFile = (s) =>
  typeof s === 'string' && /\.(png|jpe?g|gif|webp|svg)$/i.test(s);

// CRA 기준 public 경로(빌드/개발 공통)
const basePublic =
  (typeof process !== 'undefined' && process.env && process.env.PUBLIC_URL
    ? process.env.PUBLIC_URL.replace(/\/+$/, '')
    : '');
const publicPath = (p) => `${basePublic}/${String(p).replace(/^\/+/, '')}`;

/* ---------------- 이름→파일 매핑(필요한 만큼 확장) ---------------- */
const NAME_TO_FILE = {
  BRONZE: 'bronze.png',
  SILVER: 'silver.png',
  GOLD: 'gold.png',
  PLATINUM: 'platinum.png',
  DIAMOND: 'diamond.png',
  MASTER: 'master.png',
  GRANDMASTER: 'grandmaster.png',
  LEGEND: 'legend.png',

  // 실제 배지 이름이 파일로 존재한다면 여기에 추가
  FIRST_POST: 'first_post.png',
  FIRST_COMMENT: 'first_comment.png',
  POINT_COLLECTOR_100: 'point_collector_100.png',
};

/* ================= 희귀도(휘장 색/속도) ================= */
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

/* ================= 티어(S/A/B/C/D/F) ================= */
const RARITY_TO_TIER = { legendary: 's', epic: 'a', rare: 'b', uncommon: 'c', common: 'd' };
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
export function getBadgeTierLetter(badgeLike) {
  if (!badgeLike) return 'f';
  const direct = String(badgeLike?.tier ?? badgeLike?.grade ?? '').trim().toLowerCase();
  if (['s','a','b','c','d','f'].includes(direct)) return direct;
  const hinted = tierHintFromName(badgeLike?.name ?? '');
  if (hinted) return hinted;
  const viaRarity = RARITY_TO_TIER[String(getBadgeRarity(badgeLike)).toLowerCase()];
  return viaRarity || 'f';
}

/* ============= 대표뱃지 이미지 후보 생성(순차 시도용) ============= */
export function getBadgeImageCandidates(badgeLike) {
  if (!badgeLike) return [publicPath('/badges/badge_f.png')];
  const b = typeof badgeLike === 'string' ? { name: badgeLike } : badgeLike;
  const name = norm(b.name || b.badgeName || b.title || '');
  const tier = getBadgeTierLetter(b);

  const candidates = [];

  // 1) 서버에서 준 직접 경로/URL 최우선
  const direct = b.imageUrl || b.image || b.iconUrl || b.url || b.src;
  if (direct) candidates.push(isUrlLike(direct) ? direct : publicPath(direct));

  // 2) icon이 파일/URL이면 사용(이모지는 제외)
  if (looksLikeFile(b.icon) || isUrlLike(b.icon)) {
    candidates.push(isUrlLike(b.icon) ? b.icon : publicPath(b.icon));
  }

  // 3) 이름 매핑
  if (name && NAME_TO_FILE[name]) {
    candidates.push(publicPath(`/badges/${NAME_TO_FILE[name]}`));
  }

  // 4) 규칙 경로: /public/badges/{lowercase}.png
  if (name) {
    candidates.push(publicPath(`/badges/${name.toLowerCase()}.png`));
  }

  // 5) 제네릭 티어 아이콘
  candidates.push(publicPath(`/badges/badge_${tier}.png`));

  // 6) 최종 폴백
  candidates.push(publicPath('/badges/badge_f.png'));

  // 중복 제거
  return [...new Set(candidates.filter(Boolean))];
}

/* 단일 경로(이전 호환) */
export function getRepresentativeBadgeImage(badgeLike) {
  return getBadgeImageCandidates(badgeLike)[0];
}

/* ============= 대표뱃지 없을 때 보일 등급 PNG ============= */
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
  return img ? publicPath(`/badges/${img}`) : '';
}

/* 여러 형태의 사용자 객체에서 level 꺼내기 */
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

/* (과거 호환) 단순 이름 -> /badges/{name}.png */
export function getBadgeImagePath(badgeName) {
  if (!badgeName) return '';
  return publicPath(`/badges/${String(badgeName).trim()}.png`);
}
