import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../css/UserBadgeAndNickname.css';

/**
 * props
 * - user: { userId, nickname, currentLevel, representativeBadge? }
 * - showLink: boolean
 * - size: number
 * - className: string
 * - mode: 'auto' | 'level' | 'rep'
 *    auto  = 대표뱃지 있으면 대표, 없으면 등급
 *    level = 항상 등급 아이콘
 *    rep   = 대표뱃지만 (없으면 아이콘 표시 안 함)
 */
export default function UserBadgeAndNickname({
  user,
  showLink = true,
  size = 22,
  className = '',
  mode = 'auto',
}) {
  const { user: me, representativeBadge: myRep } = useAuth();
  const nick = user?.nickname || user?.name || '알 수 없는 사용자';
  const isMe = me?.userId && user?.userId && String(me.userId) === String(user.userId);

  /** 1) 대표뱃지: 해당 유저의 것만 사용 (나일 때만 컨텍스트 폴백) */
  const rep = user?.representativeBadge ?? (isMe ? myRep : null);

  const repSrcs = useMemo(() => {
    const s = [];
    if (rep?.imageUrl) s.push(rep.imageUrl);
    if (rep?.iconUrl) s.push(rep.iconUrl);
    if (rep?.code) s.push(`/badges/${String(rep.code).toLowerCase()}.png`);
    if (rep?.name) s.push(`/badges/${String(rep.name).trim().toLowerCase().replace(/\s+/g, '_')}.png`);
    if (rep?.tierLetter) s.push(`/badges/badge_${rep.tierLetter}.png`);
    s.push('/badges/placeholder.png');
    return [...new Set(s)];
  }, [rep]);

  /** 2) 등급 아이콘 (프로젝트 경로 맞춰주세요) */
  const levelSlug = useMemo(() => {
    const raw = (user?.currentLevel ?? '').toString().toLowerCase();
    if (!raw) return null;
    if (/gold|골드/.test(raw)) return 'gold';
    if (/silver|실버/.test(raw)) return 'silver';
    if (/bronze|브론즈/.test(raw)) return 'bronze';
    if (/platinum|플래티넘/.test(raw)) return 'platinum';
    if (/diamond|다이아/.test(raw)) return 'diamond';
    if (/master|마스터/.test(raw)) return 'master';
    return raw.replace(/\s+/g, '');
  }, [user?.currentLevel]);

  const levelSrcs = useMemo(() => {
    const s = [];
    if (levelSlug) {
      s.push(`/levels/${levelSlug}.png`);
      s.push(`/badges/level_${levelSlug}.png`);
      s.push(`/assets/levels/${levelSlug}.png`);
    }
    s.push('/badges/placeholder-level.png');
    return [...new Set(s)];
  }, [levelSlug]);

  /** 3) 어떤 아이콘을 쓸지 결정 */
  const wantRep = mode === 'rep' || (mode === 'auto' && rep);
  const candidates = wantRep ? repSrcs : levelSrcs;

  const [imgIdx, setImgIdx] = useState(0);
  const imgSrc = candidates[imgIdx];

  const icon = (
    <img
      className="ubn-icon"
      src={imgSrc}
      alt={wantRep ? '대표 뱃지' : `등급: ${user?.currentLevel ?? ''}`}
      style={{ width: size, height: size, objectFit: 'contain', flex: `0 0 ${size}px` }}
      onError={(e) => {
        if (imgIdx < candidates.length - 1) setImgIdx(imgIdx + 1);
      }}
    />
  );

  const inner = (
    <span className={`author-display ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      { (mode !== 'rep' || rep) && icon /* rep 모드인데 rep 없으면 아이콘 숨김 */ }
      <span className="nickname" style={{ lineHeight: 1 }}>{nick}</span>
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
