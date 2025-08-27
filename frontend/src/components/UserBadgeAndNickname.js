import React from 'react';
import { Link } from 'react-router-dom';
import {
  getBadgeRarity,
  getLevelBadgeImage,
  getUserLevel,
} from '../utils/badgeUtils';

const norm = (s) => String(s ?? '').trim().toUpperCase();

// rarity -> tier(S/A/B/C/D/F) 매핑
const RARITY_TO_TIER = { LEGENDARY: 's', EPIC: 'a', RARE: 'b', UNCOMMON: 'c', COMMON: 'd' };
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
const computeTierLetter = (badge) => {
  if (!badge) return 'f';
  const direct = (badge.tier || badge.grade || '').toString().toLowerCase();
  if (['s','a','b','c','d','f'].includes(direct)) return direct;

  const rarity = (getBadgeRarity?.(badge) || '').toString().toUpperCase();
  if (RARITY_TO_TIER[rarity]) return RARITY_TO_TIER[rarity];

  const hint = tierHintFromName(badge.name);
  return hint || 'f';
};

export default function UserBadgeAndNickname({
  user,
  showLink = true,
  showBadge = true,    // ← 헤더 등에서 중복 방지하려면 false로
  size = 22,
  className = '',
}) {
  if (!user) return null;

  const repBadge =
    user?.representativeBadge ??
    user?.data?.representativeBadge ??
    null;

  const nickname = user?.nickname || user?.name || user?.email || '사용자';
  const userId   = user?.userId || user?.id;

  const nameNode = showLink && userId
    ? <Link to={`/users/${userId}`}>{nickname}</Link>
    : <span>{nickname}</span>;

  // 배지 비표시 옵션
  if (!showBadge) {
    return <span className={`user-badge-inline ${className}`}>{nameNode}</span>;
  }

  // 1) 대표뱃지: 가이드와 동일한 센터 PNG(티어) + 링 색상
  if (repBadge) {
    const repTier = computeTierLetter(repBadge);                 // 's' | 'a' | 'b' | 'c' | 'd' | 'f'
    const repTierSrc = `/badges/badge_${repTier}.png`;           // /public/badges/badge_*.png 있어야 함
    const rarity = (getBadgeRarity(repBadge) || 'rare').toLowerCase();

    return (
      <span className={`user-badge-inline ${className}`}>
        <span
          className={`rep-badge-chip rarity-${rarity}`}
          style={{ '--rep-size': `${size}px` }}
          title={repBadge?.name || '대표 뱃지'}
        >
          <img
            src={repTierSrc}
            alt={repBadge?.name || 'badge'}
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/badges/badge_f.png'; }}
          />
        </span>
        {nameNode}
      </span>
    );
  }

  // 2) 대표뱃지 없으면: 등급 PNG
  const level = getUserLevel(user);
  const levelImg = getLevelBadgeImage(level);

  return (
    <span className={`user-badge-inline ${className}`}>
      {levelImg && (
        <img
          src={levelImg}
          alt={`${level ?? ''} 등급`}
          className="level-badge-header"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
          style={{ width: size, height: size }}
        />
      )}
      {nameNode}
    </span>
  );
}
