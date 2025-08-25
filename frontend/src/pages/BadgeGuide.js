import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import '../css/BadgeGuide.css';
import {
  FaTrophy, FaCode, FaHeart, FaMedal, FaUserPlus, FaStar, FaMagic, FaGem, FaFlask
} from 'react-icons/fa';

/** 아이콘 컴포넌트 */
const BadgeIcon = ({ badge, badgeColor }) => {
  let iconComponent;
  let iconColor = badgeColor;

  switch ((badge.category || '').toUpperCase()) {
    case 'CREATION':   iconComponent = FaCode;     break;
    case 'ENGAGEMENT': iconComponent = FaHeart;    break;
    case 'ACHIEVEMENT':iconComponent = FaTrophy;   break;
    case 'MILESTONE':  iconComponent = FaMedal;    break;
    case 'COMMUNITY':  iconComponent = FaUserPlus; break;
    case 'ACTIVITY':   iconComponent = FaFlask;    break;
    case 'SPECIAL':    iconComponent = FaMagic;    break;
    case 'EVENT':      iconComponent = FaGem;      break;
    default:           iconComponent = FaStar;     break;
  }
  return React.createElement(iconComponent, { size: 40, color: iconColor || '#8ab0d1' });
};

/** 안전 JSON 파서 */
const parseJsonSafe = async (res) => {
  try {
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) return await res.json();
  } catch (_) {}
  return null;
};

/** 여러 응답 스키마에서 배열을 뽑아내기 */
const extractArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data?.content)) return data.data.content;
  return [];
};

/** hex 색상 유효성 검사 */
const sanitizeHex = (c) => (typeof c === 'string' && /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(c.trim()) ? c.trim() : null);

/** 카테고리 폴백 색 */
const CATEGORY_DEFAULT = {
  CREATION:   '#4CAF50',
  ENGAGEMENT: '#E91E63',
  ACHIEVEMENT:'#FFD54F',
  MILESTONE:  '#FFD700',
  COMMUNITY:  '#32CD32',
  SPECIAL:    '#9C27B0',
  EVENT:      '#1E90FF',
  ACTIVITY:   '#8A2BE2',
  OTHER:      '#8ab0d1',
};

/** 뱃지 정규화 (DB color/icon 포함) */
const normalizeBadge = (b, idx = 0) => {
  const category = (b.category ?? b.badgeCategory ?? b.type ?? 'OTHER').toString().toUpperCase();
  const name = b.name ?? b.title ?? b.badgeName ?? '이름 없음';
  const isRare =
    name === 'LEGEND_ACHIEVER' ||
    name === 'POINT_COLLECTOR_10000' ||
    name === 'LOGIN_STREAK_365' ||
    b.isRare === true;

  const rawColor = b.color ?? b.hexColor ?? null;
  const color = sanitizeHex(rawColor) || CATEGORY_DEFAULT[category] || CATEGORY_DEFAULT.OTHER;

  return {
    badgeId: b.badgeId ?? b.id ?? b.badge_id ?? `badge-${idx}`,
    name,
    description: b.description ?? b.desc ?? '',
    category,
    requiredCount: b.requiredCount ?? b.requirementCount ?? b.goal ?? 1,
    requirements: b.requirements ?? b.requirementList ?? [],
    rewards: b.rewards ?? b.rewardList ?? [],
    currentProgress: b.currentProgress ?? b.progress ?? 0,
    owned: b.owned ?? b.isOwned ?? false,
    iconText: b.icon ?? '', // DB의 이모지(📝 등) 있으면 보관 (옵션)
    isRare,
    color, // ★ 여기!
  };
};

function BadgeGuide() {
  const { getAuthHeaders } = useAuth();

  const [badges, setBadges] = useState([]);
  const [userBadges, setUserBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  /** 이미지/아이콘 로딩 상태 (스켈레톤 줄 때 쓰려면) */
  const [loaded, setLoaded] = useState({});
  const markLoaded = useCallback((id) => setLoaded((p) => ({ ...p, [id]: true })), []);

  const categories = [
    { value: 'ALL', label: '전체' },
    { value: 'CREATION', label: '창작' },
    { value: 'ENGAGEMENT', label: '참여' },
    { value: 'ACHIEVEMENT', label: '업적' },
    { value: 'MILESTONE', label: '이정표' },
    { value: 'COMMUNITY', label: '커뮤니티' },
    { value: 'SPECIAL', label: '특별' },
    { value: 'EVENT', label: '이벤트' },
    // 과거 명칭 대비 (있으면 필터용)
    { value: 'ACTIVITY', label: '활동' },
  ];

  useEffect(() => {
    const fetchBadgesAndUser = async () => {
      try {
        setLoading(true);
        setError(null);

        const resAll = await fetch('/api/badges', {
          headers: getAuthHeaders(),
          credentials: 'include',
        });
        if (!resAll.ok) throw new Error('뱃지 목록 조회 실패');

        const jsonAll = await parseJsonSafe(resAll);
        const rawBadges = extractArray(jsonAll);
        const normalized = rawBadges.map((b, i) => normalizeBadge(b, i));
        setBadges(normalized);

        const resMine = await fetch('/api/badges/my', {
          headers: getAuthHeaders(),
          credentials: 'include',
        });
        if (resMine.ok) {
          const jsonMine = await parseJsonSafe(resMine);
          const mine = extractArray(jsonMine).map((b, i) => normalizeBadge(b, i));
          setUserBadges(mine);
        } else {
          setUserBadges([]);
        }
      } catch (err) {
        console.error(err);
        setBadges([]);
        setUserBadges([]);
        setError('뱃지 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchBadgesAndUser();
  }, [getAuthHeaders]);

  const filteredBadges = useMemo(() => {
    if (selectedCategory === 'ALL') return badges;
    const target = selectedCategory.toUpperCase();
    return badges.filter((b) => (b.category || '').toUpperCase() === target);
  }, [badges, selectedCategory]);

  const isOwned = (badgeId) => userBadges.some((ub) => ub.badgeId === badgeId);

  const getProgressInfo = (badge) => {
    const ub = userBadges.find((x) => x.badgeId === badge.badgeId);
    if (!ub) return null;
    const current = ub.currentProgress ?? 0;
    const required = badge.requiredCount || 1;
    return {
      current,
      required,
      percentage: Math.min(100, (current / required) * 100),
    };
  };

  if (loading) return <div className="loading-message">뱃지 정보를 불러오는 중...</div>;
  if (error) return <div className="error-message">오류: {error}</div>;

  return (
    <div className="badge-guide-page">
      <div className="container">
        <div className="page-header">
          <h1>뱃지 가이드</h1>
          <p>다양한 활동을 통해 뱃지를 획득하고 성장해보세요!</p>
        </div>

        <div className="stats-section">
          <div className="stats-card">
            <div className="stats-number">{userBadges.length}</div>
            <div className="stats-label">획득한 뱃지</div>
          </div>
          <div className="stats-card">
            <div className="stats-number">{badges.length}</div>
            <div className="stats-label">전체 뱃지</div>
          </div>
          <div className="stats-card">
            <div className="stats-number">
              {badges.length ? Math.round((userBadges.length / badges.length) * 100) : 0}%
            </div>
            <div className="stats-label">달성률</div>
          </div>
        </div>

        <div className="filter-section">
          <h3>카테고리별 필터</h3>
          <div className="category-filters">
            {categories.map((c) => (
              <button
                key={c.value}
                onClick={() => setSelectedCategory(c.value)}
                className={`category-filter ${selectedCategory === c.value ? 'active' : ''}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="badges-grid">
          {filteredBadges.map((badge) => {
            const owned = isOwned(badge.badgeId);
            const progress = getProgressInfo(badge);
            const accent = badge.color; // ★ DB 색상 사용

            return (
              <div
                key={badge.badgeId}
                className={`badge-card ${owned ? 'owned' : 'not-owned'} ${badge.isRare ? 'rainbow-badge' : ''}`}
                style={{ '--accent': accent }}
              >
                <div className="badge-image">
                  <div className={`badge-icon-container ${badge.isRare ? 'rainbow-badge-icon' : ''}`} title={badge.iconText || ''}>
                    {/* react-icons */}
                    <BadgeIcon badge={badge} badgeColor={accent} />
                  </div>
                  {owned && <div className="owned-badge">✓</div>}
                </div>

                <div className="badge-info">
                  <h4 className="badge-name">{badge.name}</h4>
                  <p className="badge-description">{badge.description}</p>

                  <div className="badge-category">
                    {/* 카테고리 텍스트 + 색상은 --accent로 */}
                    <span className="category-tag use-accent">{badge.category}</span>
                  </div>

                  {badge.requiredCount > 1 && (
                    <div className="progress-section">
                      {progress ? (
                        <>
                          <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${progress.percentage}%` }} />
                          </div>
                          <div className="progress-text">
                            {progress.current} / {progress.required}
                          </div>
                        </>
                      ) : (
                        <div className="progress-text">0 / {badge.requiredCount}</div>
                      )}
                    </div>
                  )}

                  {(badge.requirements?.length ?? 0) > 0 && (
                    <div className="badge-requirements">
                      <h5>획득 조건:</h5>
                      <ul>
                        {badge.requirements.map((req, i) => (
                          <li key={i}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(badge.rewards?.length ?? 0) > 0 && (
                    <div className="badge-rewards">
                      <h5>보상:</h5>
                      <ul>
                        {badge.rewards.map((rw, i) => (
                          <li key={i}>{rw}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredBadges.length === 0 && (
          <div className="no-badges">
            <p>해당 카테고리의 뱃지가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default BadgeGuide;
