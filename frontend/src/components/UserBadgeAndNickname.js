// src/components/UserBadgeAndNickname.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import {
  getRepresentativeBadgeImage,
  getBadgeRarity,
  getLevelBadgeImage,
  getUserLevel,
} from '../utils/badgeUtils';

const UserBadgeAndNickname = ({
  user,
  showLink = true,
  size = 22,          // 아이콘 크기(px)
  className = '',
}) => {
  if (!user) return null;

  const repBadge =
    user?.representativeBadge ??
    user?.data?.representativeBadge ??
    null;

  const nickname = user?.nickname || user?.name || user?.email || '사용자';
  const userId   = user?.userId || user?.id;

  // 1) 대표뱃지 우선
  if (repBadge) {
    const src = getRepresentativeBadgeImage(repBadge);
    const rarity = getBadgeRarity(repBadge);
    const chip = (
      <span
        className={`rep-badge-chip rarity-${rarity}`}
        style={{ '--rep-size': `${size}px` }}
        title={repBadge?.name || '대표 뱃지'}
      >
        <img
          src={src}
          alt={repBadge?.name || 'badge'}
          onError={(e) => { e.currentTarget.src = '/badges/placeholder.png'; }}
        />
      </span>
    );

    const nameNode = showLink && userId
      ? <Link to={`/users/${userId}`}>{nickname}</Link>
      : <span>{nickname}</span>;

    return (
      <span className={`user-badge-inline ${className}`}>
        {chip}
        {nameNode}
      </span>
    );
  }

  // 2) 대표뱃지 없으면 등급 PNG
  const level = getUserLevel(user);
  const levelImg = getLevelBadgeImage(level);

  const levelNode = levelImg ? (
    <img
      src={levelImg}
      alt={`${level ?? ''} 등급`}
      className="level-badge-header"
      onError={(e) => { e.currentTarget.style.display = 'none'; }}
      style={{ width: size, height: size }}
    />
  ) : null;

  const nameNode = showLink && userId
    ? <Link to={`/users/${userId}`}>{nickname}</Link>
    : <span>{nickname}</span>;

  return (
    <span className={`user-badge-inline ${className}`}>
      {levelNode}
      {nameNode}
    </span>
  );
};

export default UserBadgeAndNickname;
