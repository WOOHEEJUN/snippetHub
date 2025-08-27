// src/utils/badgeUtils.js

/* ---------- helpers ---------- */
const norm = (s) => String(s ?? "").trim().toUpperCase();

/* rarity -> letter */
const RARITY_TO_LETTER = {
  LEGENDARY: "s",
  EPIC: "a",
  RARE: "b",
  UNCOMMON: "c",
  COMMON: "d",
};

const hintFromName = (name = "") => {
  const s = norm(name);
  if (/\bS(\b|_RANK|_TIER)/.test(s)) return "s";
  if (/\bA(\b|_RANK|_TIER)/.test(s)) return "a";
  if (/\bB(\b|_RANK|_TIER)/.test(s)) return "b";
  if (/\bC(\b|_RANK|_TIER)/.test(s)) return "c";
  if (/\bD(\b|_RANK|_TIER)/.test(s)) return "d";
  if (/\bF(\b|_RANK|_TIER|_BADGE)?\b/.test(s)) return "f";
  return null;
};

/** 입력(배지 객체 or 문자열)에서 S/A/B/C/D/F 한 글자 계산 */
export const computeTierLetter = (input) => {
  if (!input) return "f";

  // 문자열이면: 's','a'… 혹은 이름 힌트
  if (typeof input === "string") {
    const s = input.trim().toLowerCase();
    if (["s", "a", "b", "c", "d", "f"].includes(s)) return s;
    const hinted = hintFromName(input);
    return hinted || "f";
  }

  // 객체이면: tier/grade > rarity > name 힌트 순
  const t = (input.tier ?? input.grade ?? "").toString().trim().toLowerCase();
  if (["s", "a", "b", "c", "d", "f"].includes(t)) return t;

  const viaRarity = RARITY_TO_LETTER[norm(input.rarity)];
  if (viaRarity) return viaRarity;

  const hinted = hintFromName(input.name);
  return hinted || "f";
};

/** 기본 경로 하나 반환: /badges/badge_{letter}.png */
export const getBadgeImagePath = (input) => {
  const letter = computeTierLetter(input);
  return `/badges/badge_${letter}.png`;
};

/** 후보 경로들(오타 폴백 포함) */
export const getBadgeImageCandidates = (input) => {
  const letter = computeTierLetter(input);
  const list = [`/badges/badge_${letter}.png`];

  // 사용자의 폴더에만 있는 B 오타 파일명까지 시도
  if (letter === "b") list.push("/badges/badges_b.png");

  // 최후 폴백: F
  if (letter !== "f") list.push("/badges/badge_f.png");

  return list;
};

/* --------- 레벨 뱃지 (파일명은 사용자 폴더 기준) --------- */
const LEVEL_IMAGE_MAP = {
  BRONZE: "bronze.png",
  SILVER: "silver.png",
  GOLD: "gold.png",
  PLATINUM: "platinum.png",
  DIAMOND: "diamond.png",
  MASTER: "master.png",
  GRANDMASTER: "grandmaster.png",
  LEGEND: "legend.png",
};

export const getLevelBadgeImage = (level) => {
  if (!level) return "";
  const file = LEVEL_IMAGE_MAP[norm(level)];
  return file ? `/badges/${file}` : "";
};

export default {
  computeTierLetter,
  getBadgeImagePath,
  getBadgeImageCandidates,
  getLevelBadgeImage,
};
