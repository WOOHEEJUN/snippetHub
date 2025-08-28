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

/**
 * props
 * - user: { userId, nickname, currentLevel, representativeBadge? }
 * - showLink: boolean
 * - size: number
 * - className: string
 * - mode: 'auto' | 'level' | 'rep'
 *    auto  = 대표 있으면 대표, 없으면 등급 PNG
 *    level = 항상 등급 PNG (/badges/{level}.png)
 *    rep   = 대표뱃지 이미지만 (없으면 아이콘 없음)
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

  // 1) 대표뱃지 후보 (그 유저의 것만; 내 프로필이면 컨텍스트 폴백 허용)
  const rep = user?.representativeBadge ?? (isMe ? myRep : null);
  const repCandidates = useMemo(() => pickRepSrcs(rep), [rep]);
  const [repIdx, setRepIdx] = useState(0);
  const repSrc = repCandidates[repIdx] || null;

  // 2) 등급 PNG 경로
  const levelSrc = (() => {
    const key = levelKey(user?.currentLevel);
    return key ? `/badges/${key}.png` : null;
  })();

  // 3) 어떤 이미지를 쓸지 결정
  let imgSrc = null;
  if (mode === 'rep') imgSrc = repSrc || null;
  else if (mode === 'level') imgSrc = levelSrc || null;
  else /* auto */ imgSrc = repSrc || levelSrc || null;

  const Img = imgSrc ? (
    <img
      className="ubn-icon"
      src={imgSrc}
      alt="icon"
      style={{ width: size, height: size, marginRight: 6 }}
      onError={(e) => {
        // 더 이상 'gold.png'로 떨어지지 않게, 실패 시 숨김
        if (repSrc && repIdx < repCandidates.length - 1) {
          // 대표뱃지 후보가 더 있으면 다음 후보 시도
          setRepIdx(repIdx + 1);
        } else {
          e.currentTarget.style.display = 'none';
        }
      }}
    />
  ) : null;

  const inner = (
    <span className={`author-display ${className}`}>
      {Img}
      <span className="nickname">{nick}</span>
    </span>
  );

  return showLink && user?.userId ? (
    <Link to={`/users/${user.userId}`} className="author-link" style={{ textDecoration: 'none' }}>
      {inner}
    </Link>
  ) : (
    inner
  );
}
