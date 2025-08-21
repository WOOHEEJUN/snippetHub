export const getLevelBadgeImage = (level) => {
  if (level === undefined || level === null) {
    return null;
  }
  const levelName = getLevelName(level); // getLevelName 함수를 사용하여 등급 이름으로 변환
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
    default:
      return null;
  }
};