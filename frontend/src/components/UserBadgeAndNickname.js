import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './UserBadgeAndNickname.css'; // 아래 CSS 참고(선택)

const pickBadgeSrc = (b) => {
  if (!b) return null;
  return (
    b.imageUrl ||
    b.iconUrl ||
    (b.code ? `/badges/${String(b.code).toLowerCase()}.png` : null) ||
    (b.name ? `/badges/${String(b.name).trim().toLowerCase().replace(/\s+/g,'_')}.png` : null)
  );
};

export default function UserBadgeAndNickname({
  user,
  showLink = true,
  size = 22,
  className = '',
}) {
  const { representativeBadge } = useAuth();
  const nick = user?.nickname || user?.name || '알 수 없는 사용자';

  // 컨텍스트의 대표 뱃지를 우선 사용하되, user 객체에 직접 주입된 경우도 폴백으로 고려
  const badgeToDisplay = representativeBadge ?? user?.representativeBadge;
  const repSrc = pickBadgeSrc(badgeToDisplay);

  const inner = (
    <span className={`author-display ${className}`}>
      {repSrc && (
        <img
          className="rep-badge-chip"
          src={repSrc}
          alt="대표 뱃지"
          style={{ width: size, height: size, marginRight: 6 }}
          onError={(e) => { 
            // 이미지 로드 실패 시 기본 이미지로 대체
            e.currentTarget.onerror = null; // 무한 루프 방지
            e.currentTarget.src = '/badges/gold.png'; 
          }}
        />
      )}
      <span className="nickname">{nick}</span>
    </span>
  );

  if (showLink && user?.userId) {
    return (
      <Link to={`/profile/${user.userId}`} className="author-link" style={{ textDecoration: 'none' }}>
        {inner}
      </Link>
    );
  }
  
  // 링크가 필요 없는 경우(e.g., 헤더)
  return inner;
}