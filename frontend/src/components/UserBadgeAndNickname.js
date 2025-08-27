import React from 'react';
import { Link } from 'react-router-dom';
import { getRepresentativeBadgeImage, getLevelBadgeImage, getUserLevel } from '../utils/badgeUtils';

const UserBadgeAndNickname = ({ user, showLink = true, className = '' }) => {
  if (!user) return <span>-</span>;

  const repBadge = user.representativeBadge;
  const userLevel = getUserLevel(user);
  const levelImgSrc = getLevelBadgeImage(userLevel);

  const badgeElement = repBadge ? (
    <img
      src={getRepresentativeBadgeImage(repBadge)}
      alt={repBadge.name || '대표 뱃지'}
      className="level-badge-inline" // Reusing existing class for now
      style={{ marginRight: '4px' }}
    />
  ) : (
    userLevel && levelImgSrc && (
      <img
        src={levelImgSrc}
        alt={`${userLevel} 등급`}
        className="level-badge-inline" // Reusing existing class for now
        style={{ marginRight: '4px' }}
      />
    )
  );

  const nicknameElement = user.nickname || user.email || '-';

  if (showLink && user.userId) {
    return (
      <Link to={`/users/${user.userId}`} className={`author-link ${className}`}>
        {badgeElement}
        {nicknameElement}
      </Link>
    );
  } else {
    return (
      <span className={`author-info-inline ${className}`}>
        {badgeElement}
        {nicknameElement}
      </span>
    );
  }
};

export default UserBadgeAndNickname;
