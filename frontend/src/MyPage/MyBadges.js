import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

function MyBadges() {
  const { user, getAuthHeaders } = useAuth();
  const [level, setLevel] = useState(null);
  const [points, setPoints] = useState(null);
  const [badges, setBadges] = useState([]);
  const [featuredBadges, setFeaturedBadges] = useState([]);

  useEffect(() => {
    if (!user) return;

    // 내 등급 정보
    fetch('/api/users/level', { headers: getAuthHeaders(), credentials: 'include' })
      .then(res => res.json())
      .then(data => setLevel(data.data))
      .catch(() => {});

    // 내 포인트 정보
    fetch('/api/points/my', { headers: getAuthHeaders(), credentials: 'include' })
      .then(res => res.json())
      .then(data => setPoints(data.data))
      .catch(() => {});

    // 내 전체 뱃지
    fetch('/api/badges/my', { headers: getAuthHeaders(), credentials: 'include' })
      .then(res => res.json())
      .then(data => setBadges(data.data || []))
      .catch(() => {});

    // 내 대표 뱃지
    fetch('/api/badges/my/featured', { headers: getAuthHeaders(), credentials: 'include' })
      .then(res => res.json())
      .then(data => setFeaturedBadges(data.data || []))
      .catch(() => {});
  }, [user, getAuthHeaders]);

  return (
    <div className="my-badges-page" style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
      <h2 style={{ marginBottom: 24 }}>마이페이지</h2>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 32,
        marginBottom: 32
      }}>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: 18 }}>👑 등급</div>
          <div>{level ? `${level.levelName} (Lv.${level.level})` : '정보 없음'}</div>
        </div>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: 18 }}>💰 포인트</div>
          <div>{points ? `${points.point} P` : '정보 없음'}</div>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>🏅 대표 뱃지</div>
        {featuredBadges.length === 0
          ? <div>대표 뱃지가 없습니다.</div>
          : (
            <div style={{ display: 'flex', gap: 16 }}>
              {featuredBadges.map(badge => (
                <div key={badge.badgeId} style={{ textAlign: 'center' }}>
                  <img src={badge.imageUrl} alt={badge.name} style={{ width: 48, height: 48 }} />
                  <div style={{ fontSize: 14 }}>{badge.name}</div>
                </div>
              ))}
            </div>
          )
        }
      </div>

      <div>
        <div style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>🎖️ 내 모든 뱃지</div>
        {badges.length === 0
          ? <div>획득한 뱃지가 없습니다.</div>
          : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              {badges.map(badge => (
                <div key={badge.badgeId} style={{ textAlign: 'center' }}>
                  <img src={badge.imageUrl} alt={badge.name} style={{ width: 40, height: 40, opacity: badge.owned ? 1 : 0.3 }} />
                  <div style={{ fontSize: 13 }}>{badge.name}</div>
                </div>
              ))}
            </div>
          )
        }
      </div>
    </div>
  );
}

export default MyBadges;