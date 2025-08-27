// src/utils/badgeUtils.js

/** ---------- helpers ---------- */
const norm = (s) => String(s ?? "").trim().toUpperCase();
const isUrlLike = (s) =>
  typeof s === "string" && (/^https?:\/\//i.test(s) || s.startsWith("/"));
const looksLikeFile = (s) =>
  typeof s === "string" && /\.(png|jpe?g|gif|webp|svg)$/i.test(s);

/** ---------- coin images for tiers ---------- */
const TIER_FILES = {
  s: "badge_s.png",
  a: "badge_a.png",
  b: "badge_b.png",
  c: "badge_c.png",
  d: "badge_d.png",
  f: "badge_f.png",
};

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

/** rarity → default tier */
const rarityToTier = (r) =>
  ({ LEGENDARY: "s", EPIC: "a", RARE: "b", UNCOMMON: "c", COMMON: "d" }[
    norm(r)
  ] || "f");

/** lightweight rarity estimation (when server doesn't provide) */
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

/**
 * Get the tier letter for a badge (s/a/b/c/d/f).
 * Accepts a badge object or a string name.
 */
export const getTierLetter = (badgeOrName) => {
  if (!badgeOrName) return "f";

  // string case
  if (typeof badgeOrName === "string") {
    // if it's a direct file/url we cannot infer tier; default to 'f'
    if (isUrlLike(badgeOrName) || looksLikeFile(badgeOrName)) return "f";
    return tierFromNameHint(badgeOrName) ?? "f";
  }

  // object case
  const b = badgeOrName;
  if (b.tierLetter) return String(b.tierLetter).toLowerCase();
  if (b.tier) return String(b.tier).toLowerCase();

  const hinted = tierFromNameHint(b.name);
  if (hinted) return hinted;

  const rarity = b.rarity ?? computeRarityLight(b);
  return rarityToTier(rarity);
};

/**
 * Returns an image path for a badge.
 * - If you pass a badge OBJECT, it returns the coin PNG for its tier (S/A/B/C/D/F).
 * - If you pass a STRING:
 *    - If it looks like a url/file, it is returned as-is.
 *    - Otherwise we infer a tier from the name and return a coin PNG.
 */
export const getBadgeImagePath = (badgeOrName) => {
  // string name/path
  if (typeof badgeOrName === "string") {
    const s = badgeOrName.trim();
    if (isUrlLike(s) || looksLikeFile(s)) return s;
    const t = getTierLetter(s);
    return `/badges/${TIER_FILES[t] ?? TIER_FILES.f}`;
  }

  // object
  const tier = getTierLetter(badgeOrName);
  const file = TIER_FILES[tier] ?? TIER_FILES.f;
  return `/badges/${file}`;
};

/** Level badge (rank) images */
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
