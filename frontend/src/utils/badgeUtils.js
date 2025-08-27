// src/utils/badgeUtils.js

/** ---------------- helpers ---------------- */
const norm = (s) => String(s ?? "").trim().toUpperCase();
const isUrlLike = (s) =>
  typeof s === "string" && (/^https?:\/\//i.test(s) || s.startsWith("/"));
const looksLikeFile = (s) =>
  typeof s === "string" && /\.(png|jpe?g|gif|webp|svg)$/i.test(s);

/** ---------------- coin images for S/A/B/C/D/F ---------------- */
const TIER_FILES = {
  s: "badge_s.png",
  a: "badge_a.png",
  b: "badge_b.png",
  c: "badge_c.png",
  d: "badge_d.png",
  f: "badge_f.png",
};
const tierPngPath = (t) => `/badges/${TIER_FILES[t] ?? TIER_FILES.f}`;

/** name → tier hint (S/A/B/C/D/F) */
const tierFromNameHint = (name) => {
  const s = norm(name);
  if (/\bS(\b|_RANK|_TIER)/.test(s)) return "s";
  if (/\bA(\b|_RANK|_TIER)/.test(s)) return "a";
  if (/\bB(\b|_RANK|_TIER)/.test(s)) return "b";
  if (/\bC(\b|_RANK|_TIER)/.test(s)) return "c";
  if (/\bD(\b|_RANK|_TIER)/.test(s)) return "d";
  if (/\bF(\b|_RANK|_TIER|_BADGE)?\b/.test(s)) return "f";
  return null;
};

/** rarity → default tier (fallback) */
const rarityToTier = (r) =>
  ({ LEGENDARY: "s", EPIC: "a", RARE: "b", UNCOMMON: "c", COMMON: "d" }[
    norm(r)
  ] || "f");

/** super-light rarity estimator (서버가 안 줄 때만) */
const computeRarityLight = (b) => {
  const name = norm(b?.name);
  const rc = Number(b?.required_count ?? b?.requiredCount ?? b?.goal ?? 0) || 0;
  const pts = Number(b?.points_reward ?? b?.pointsReward ?? 0) || 0;
  if (b?.isRare === true || /LEGEND|GRANDMASTER|DIAMOND/.test(name) || rc >= 2000 || pts >= 2000)
    return "legendary";
  if (rc >= 800 || /MASTER/.test(name) || pts >= 800) return "epic";
  if (rc >= 250 || pts >= 400) return "rare";
  if (rc >= 60 || pts >= 120) return "uncommon";
  return "common";
};

/** ---------------- public API ---------------- */

/**
 * 배지 객체/이름에서 S/A/B/C/D/F 티어 글자를 돌려줍니다.
 * @param {object|string} badgeOrName
 * @returns {'s'|'a'|'b'|'c'|'d'|'f'}
 */
export const getTierLetter = (badgeOrName) => {
  if (!badgeOrName) return "f";

  if (typeof badgeOrName === "string") {
    if (isUrlLike(badgeOrName) || looksLikeFile(badgeOrName)) return "f";
    return tierFromNameHint(badgeOrName) ?? "f";
  }

  const b = badgeOrName;
  if (b.tierLetter) return String(b.tierLetter).toLowerCase();
  if (b.tier) return String(b.tier).toLowerCase();

  const hinted = tierFromNameHint(b.name);
  if (hinted) return hinted;

  const rarity = b.rarity ?? computeRarityLight(b);
  return rarityToTier(rarity);
};

/**
 * 가장 “안전한” 단일 이미지 경로를 리턴합니다.
 * - 문자열이 URL/파일이면 그대로 반환
 * - 그 외엔 티어 코인 PNG(/public/badges/badge_*.png) 반환
 */
export const getBadgeImagePath = (badgeOrName) => {
  if (typeof badgeOrName === "string") {
    const s = badgeOrName.trim();
    if (isUrlLike(s) || looksLikeFile(s)) return s;
    return tierPngPath(getTierLetter(s));
  }
  // 객체
  const b = badgeOrName ?? {};
  const direct =
    b.imageUrl || b.image || b.iconUrl || b.iconPath || b.url || b.src;
  if (direct && (isUrlLike(direct) || looksLikeFile(direct))) return direct;
  return tierPngPath(getTierLetter(b));
};

/**
 * 여러 후보 경로를 우선순위대로 반환합니다.
 * 첫 번째가 주로 쓰이지만, 실패 시 뒤에서 차례로 시도할 수 있습니다.
 */
export const getBadgeImageCandidates = (badgeOrName) => {
  const candidates = [];

  if (typeof badgeOrName === "string") {
    const s = badgeOrName.trim();
    if (isUrlLike(s) || looksLikeFile(s)) {
      candidates.push(s);
    } else {
      candidates.push(tierPngPath(getTierLetter(s)));
    }
  } else if (badgeOrName && typeof badgeOrName === "object") {
    const b = badgeOrName;
    // 1) 서버가 준 직접 경로들
    [b.imageUrl, b.image, b.iconUrl, b.iconPath, b.url, b.src]
      .filter(Boolean)
      .forEach((p) => {
        if (isUrlLike(p) || looksLikeFile(p)) candidates.push(String(p));
      });
    // 2) 티어 PNG
    candidates.push(tierPngPath(getTierLetter(b)));
  } else {
    candidates.push(tierPngPath("f"));
  }

  // 3) 최후의 폴백
  candidates.push(tierPngPath("f"));

  // 중복 제거
  return [...new Set(candidates)];
};

/** 등급(레벨) 배지 PNG 경로 */
export const getLevelBadgeImage = (level) => {
  if (!level) return "";
  const map = {
    BRONZE: "bronze.png",
    SILVER: "silver.png",
    GOLD: "gold.png",
    PLATINUM: "platinum.png",
    DIAMOND: "diamond.png",
    MASTER: "master.png",
    GRANDMASTER: "grandmaster.png",
    LEGEND: "legend.png",
  };
  const name = map[norm(level)];
  return name ? `/badges/${name}` : "";
};
