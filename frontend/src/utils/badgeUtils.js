export const getLevelBadgeImage = (levelName) => {
  if (!levelName) {
    return null;
  }
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
    // 필요에 따라 다른 등급 추가
    default:
      return null; // 또는 기본 뱃지 이미지
  }
};
