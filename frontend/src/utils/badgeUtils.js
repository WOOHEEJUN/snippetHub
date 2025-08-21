// src/utils/badgeUtils.js

// 영문 → 한글 매핑
const EN_TO_KO = {
  BRONZE: '브론즈',
  SILVER: '실버',
  GOLD: '골드',
  PLATINUM: '플래티넘',
  DIAMOND: '다이아몬드',
  MASTER: '마스터',
  GRANDMASTER: '그랜드마스터',
  LEGEND: '레전드',
};

// 숫자 → 영문 매핑 (1~8)
const NUM_TO_EN = {
  1: 'BRONZE',
  2: 'SILVER',
  3: 'GOLD',
  4: 'PLATINUM',
  5: 'DIAMOND',
  6: 'MASTER',
  7: 'GRANDMASTER',
  8: 'LEGEND',
};

/**
 * 입력을 한글 등급명으로 변환
 * - number: 1~8 → 매핑
 * - string: 영문/한글 모두 허용 (대소문자 무시)
 * - object: { name } 또는 { level } 지원
 */
export const getLevelName = (level) => {
  if (level == null) return '';

  // 숫자
  if (typeof level === 'number') {
    const en = NUM_TO_EN[level];
    return en ? EN_TO_KO[en] : '';
  }

  // 문자열
  if (typeof level === 'string') {
    const raw = level.trim();
    const upper = raw.toUpperCase();

    // 영문 이름인 경우
    if (EN_TO_KO[upper]) return EN_TO_KO[upper];

    // 한글 이름이 이미 들어온 경우
    const koList = Object.values(EN_TO_KO);
    if (koList.includes(raw)) return raw;

    return '';
  }

  // 객체
  if (typeof level === 'object') {
    if (typeof level.name === 'string') return getLevelName(level.name);
    if (typeof level.level === 'number') return getLevelName(level.level);
  }

  return '';
};

export const getLevelBadgeImage = (level) => {
  if (level === undefined || level === null) return null;

  const levelName = getLevelName(level); // 등급 이름(한글)으로 통일
  const normalizedLevelName = levelName.toLowerCase();

  switch (normalizedLevelName) {
    case '브론즈':
      return '/badges/bronze.png';
    case '실버':
      return '/badges/silver.png';
    case '골드':
      return '/badges/gold.png';
    case '플래티넘':
      return '/badges/platinum.png';
    case '다이아몬드':
      return '/badges/diamond.png';
    // 필요 시 아래 주석 해제 후 배지 이미지 추가
    // case '마스터':
    //   return '/badges/master.png';
    // case '그랜드마스터':
    //   return '/badges/grandmaster.png';
    // case '레전드':
    //   return '/badges/legend.png';
    default:
      return null;
  }
};
