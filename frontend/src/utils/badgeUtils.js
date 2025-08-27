// src/utils/badgeUtils.js

/* ---------------- 공용 유틸 ---------------- */
const norm = (s) => String(s ?? '').trim().toUpperCase();
const isUrlLike = (s) => typeof s === 'string' && /^https?:\/\//i.test(s);
const looksLikeFile = (s) =>
  typeof s === 'string' && /\.(png|jpe?g|gif|webp|svg)$/i.test(s);

// CRA/webpack 에서 public 경로
const basePublic =
  (typeof process !== 'undefined' && process.env && process.env.PUBLIC_URL
    ? process.env.PUBLIC_URL.replace(/\/+$/, '')
    : '');
const publicPath = (p) => `${basePublic}/${String(p).replace(/^\/+/, '')}`;

/* ---------------- 이름→파일 매핑(필요시 추가) ---------------- */
const NAME_TO_FILE = {
  BRONZE: 'bronze.png',
  SILVER: 'silver.png',
  GOLD: 'gold.png',
  PLATINUM: 'platinum.png',
  DIAMOND: 'diamond.png',
  MASTER: 'master.png',
  GRANDMASTER: 'grandmaster.png',
  LEGEND: 'legend.png',

  // 실제 배지 이름들 매핑(있으면 계속 추가)
  FIRST_POST: 'first_post.png',
  FIRST_COMMENT: 'first_comment.png',
  POINT_COLLECTOR_100: 'point_collector_100.png',
};

/* 대표 뱃지 코어 이미지 경로(실제 파일/URL을 최우선) */
export function getRepresentativeBadgeImage(badgeLike) {
  if (!badgeLike) return publicPath('/badges/placeholder.png');

  const b = typeof badgeLike === 'string' ? { name: badgeLike } : badgeLike;

  // 1) 서버에서 준 실제 경로 우선
  const direct = b.imageUrl || b.iconUrl || b.image || b.url || b.src;
  if (direct) return isUrlLike(direct) ? direct : publicPath(direct);

  // 2) icon이 파일/URL이면 사용 (이모지 제외)
  if (looksLikeFile(b.icon) || isUrlLike(b.icon)) {
    return isUrlLike(b.icon) ? b.icon : publicPath(b.icon);
  }

  // 3) 이름 매핑
  const name = norm(b.name || b.badgeName || b.title || '');
  if (NAME_TO_FILE[name]) return publicPath(`/badges/${NAME_TO_FILE[name]}`);

  // 4) 규칙: /public/badges/{이름소문자}.png
  if (name) return publicPath(`/badges/${name.toLowerCase()}.png`);

  // 5) 폴백
  return publicPath('/badges/placeholder.png');
}

/* 희귀도(휘장 링 색에만 사용) */
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

/* 대표뱃지 없을 때 보여줄 등급 PNG */
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

/* 여러 형태의 사용자 객체에서 level 추출 */
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

/* (호환) /badges/{name}.png */
export function getBadgeImagePath(badgeName) {
  if (!badgeName) return '';
  return publicPath(`/badges/${String(badgeName).trim()}.png`);
}
