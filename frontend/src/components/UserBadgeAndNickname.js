import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../css/UserBadgeAndNickname.css';

/** 등급 문자열 → 파일명 매핑 (한/영 모두 허용) */
const levelKey = (lv) => {
  const s = String(lv ?? '').trim().toLowerCase();
  if (!s) return null;
  const map = {
    골드: 'gold',
    금장: 'gold',
    실버: 'silver',
    은장: 'silver',
    브론즈: 'bronze',
    동장: 'bronze',
    플래티넘: 'platinum',
    플레티넘: 'platinum',
    다이아: 'diamond',
    다이아몬드: 'diamond',
    마스터: 'master',
    그랜드마스터: 'grandmaster',
    레전드: 'legend',
    // 영문/대소문자
    gold: 'gold',
    silver: 'silver',
    bronze: 'bronze',
    platinum: 'platinum',
    diamond: 'diamond',
    master: 'master',
    grandmaster: 'grandmaster',
    legend: 'legend',
  };
  return map[s] || null;
};

const pickRepSrcs = (rep) => {
  if (!rep) return [];
  const cand = [];
  if (rep.imageUrl) cand.push(rep.imageUrl);
  if (rep.iconUrl) cand.push(rep.iconUrl);
  if (rep.code)     cand.push(`/badges/${String(rep.code).toLowerCase()}.png`);
  if (rep.name) {
    const slug = String(rep.name).trim().toLowerCase().replace(/\s+/g, '_');
    cand.push(`/badges/${slug}.png`);
  }
  // 중복 제거
  return [...new Set(cand)];
};

export default function UserBadgeAndNickname({
  user,
  showLink = true,
  size = 22,
  className = '',
}) {
  const { representativeBadge } = useAuth();
  const nick = user?.nickname || user?.name || '알 수 없는 사용자';

  const badgeToDisplay = representativeBadge ?? user?.representativeBadge;
  const repSrcs = pickRepSrcs(badgeToDisplay);
  const primarySrc = repSrcs[0] || null;

  const inner = (
    <span className={`author-display ${className}`}>
      {primarySrc && (
        <img
          className="rep-badge-chip"
          src={primarySrc}
          alt="대표 뱃지"
          style={{ width: size, height: size, marginRight: 6 }}
          onError={(e) => { 
            e.currentTarget.onerror = null; 
            e.currentTarget.src = '/badges/gold.png'; 
          }}
        />
      )}
      <span className="nickname">{nick}</span>
    </span>
  );

  if (showLink && user?.userId) {
    return (
      <Link to={`/users/${user.userId}`} className="author-link" style={{ textDecoration: 'none' }}>
        {inner}
      </Link>
    );
  }
  
  return inner;
}