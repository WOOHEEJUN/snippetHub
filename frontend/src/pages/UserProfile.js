// src/pages/UserProfile.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaFileAlt, FaCode, FaComment, FaHeart, FaEye } from 'react-icons/fa';
import UserBadgeAndNickname from '../components/UserBadgeAndNickname'; // Added import

import '../css/UserProfile.css';
import { getBadgeRarity, getLevelBadgeImage, getUserLevel } from '../utils/badgeUtils';

/* ===== 티어 계산: 가이드와 동일 규칙 간이판 ===== */
const norm = (s) => String(s ?? '').trim().toUpperCase();
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
  if (['s', 'a', 'b', 'c', 'd', 'f'].includes(direct)) return direct;

  const rarity = (getBadgeRarity?.(badge) || '').toString().toUpperCase();
  if (RARITY_TO_TIER[rarity]) return RARITY_TO_TIER[rarity];

  const byName = tierHintFromName(badge.name);
  return byName || 'f';
};

const UserProfile = () => {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [snippets, setSnippets] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/profile`);
      if (response.ok) {
        const data = await response.json();
        setUser(data.data);
      } else {
        setError('사용자를 찾을 수 없습니다.');
      }
    } catch {
      setError('프로필을 불러오는데 실패했습니다.');
    }
  };

  const fetchUserPosts = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/posts?page=0&size=10`);
    if (response.ok) {
        const data = await response.json();
        setPosts(data.data.content || []);
      }
    } catch {}
  };

  const fetchUserSnippets = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/snippets?page=0&size=10`);
      if (response.ok) {
        const data = await response.json();
        setSnippets(data.data.content || []);
      }
    } catch {}
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchUserProfile(), fetchUserPosts(), fetchUserSnippets()]);
      setLoading(false);
    };
    loadData();
  }, [userId]);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('ko-KR');

  if (loading) return <div className="user-profile-container"><div className="loading">로딩 중...</div></div>;
  if (error) return <div className="user-profile-container"><div className="error">{error}</div></div>;
  if (!user) return <div className="user-profile-container"><div className="error">사용자를 찾을 수 없습니다.</div></div>;

  /* ---------- 대표뱃지/등급 아이콘 계산 ---------- */
  // 1) 대표뱃지 (프로필 응답에 없으면 falsy)
  const repBadge =
    user?.representativeBadge ??
    user?.data?.representativeBadge ??
    null;

  // 2) 대표뱃지 있으면 가이드와 동일한 티어 PNG
  const repTier = repBadge ? computeTierLetter(repBadge) : null; // 's'...'f'
  const repTierSrc = repBadge ? `/badges/badge_${repTier}.png` : null;
  const repRarity = repBadge ? (getBadgeRarity(repBadge) || 'rare').toLowerCase() : null;

  // 3) 대표뱃지가 없을 때는 표준화된 등급키로 이미지 선택 (한글 → 영문 매핑 포함)
const levelKey = (getUserLevel(user) || 'BRONZE').toUpperCase(); // e.g. 'GOLD'
const levelImgSrc =
  getLevelBadgeImage(levelKey) ||
  `/badges/${levelKey.toLowerCase()}.png`;

  return (
    <div className="user-profile-container">
      <div className="profile-header">
        <div className="profile-level-display">
          {repBadge ? (
            <span
              className={`rep-badge-chip rarity-${repRarity}`}
              style={{ '--rep-size': '80px' }}
              title={repBadge?.name || '대표 뱃지'}
            >
              <img
                src={repTierSrc}
                alt={repBadge?.name || '대표 뱃지'}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/badges/badge_f.png';
                }}
              />
            </span>
          ) : (
            <img
              className="profile-level-badge-large"
              src={levelImgSrc}
              alt={`${levelKey} 등급`}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/badges/bronze.png';
              }}
            />
          )}
        </div>

        <div className="profile-info">
            <UserBadgeAndNickname user={user} showLink={false} />
          {user.levelName && user.level && (
            <p className="profile-level">등급: {user.levelName} (Lv.{user.level})</p>
          )}
          {user.points !== undefined && (
            <p className="profile-points">포인트: {user.points} P</p>
          )}
          {user.bio && <p className="profile-bio">{user.bio}</p>}

          <div className="profile-stats">
            <div className="stat-item">
              <FaFileAlt className="stat-icon" />
              <span className="stat-value">{user.stats?.totalPosts || 0}</span>
              <span className="stat-label">게시글</span>
            </div>
            <div className="stat-item">
              <FaCode className="stat-icon" />
              <span className="stat-value">{user.stats?.totalSnippets || 0}</span>
              <span className="stat-label">스니펫</span>
            </div>
            <div className="stat-item">
              <FaComment className="stat-icon" />
              <span className="stat-value">{user.stats?.totalComments || 0}</span>
              <span className="stat-label">댓글</span>
            </div>
            <div className="stat-item">
              <FaHeart className="stat-icon" />
              <span className="stat-value">{user.stats?.totalLikes || 0}</span>
              <span className="stat-label">좋아요</span>
            </div>
            <div className="stat-item">
              <FaEye className="stat-icon" />
              <span className="stat-value">{user.stats?.totalViews || 0}</span>
              <span className="stat-label">조회수</span>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-content">
        <div className="tab-navigation">
          <button
            className={`tab-button ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            게시글 ({posts.length})
          </button>
          <button
            className={`tab-button ${activeTab === 'snippets' ? 'active' : ''}`}
            onClick={() => setActiveTab('snippets')}
          >
            스니펫 ({snippets.length})
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'posts' && (
            <div className="posts-list">
              {posts.length === 0 ? (
                <div className="no-content">작성한 게시글이 없습니다.</div>
              ) : (
                posts.map((post) => (
                  <div key={post.postId} className="content-item">
                    <Link to={`/board/${post.postId}`} className="content-link">
                      <h3 className="content-title">{post.title}</h3>
                      <p className="content-excerpt">
                        {(post.content || '').substring(0, 100)}...
                      </p>
                      <div className="content-meta">
                        <span className="content-date">{formatDate(post.createdAt)}</span>
                        <span className="content-views">조회 {post.viewCount}</span>
                        <span className="content-likes">좋아요 {post.likeCount}</span>
                      </div>
                    </Link>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'snippets' && (
            <div className="snippets-list">
              {snippets.length === 0 ? (
                <div className="no-content">작성한 스니펫이 없습니다.</div>
              ) : (
                snippets.map((snippet) => (
                  <div key={snippet.snippetId} className="content-item">
                    <Link to={`/snippets/${snippet.snippetId}`} className="content-link">
                      <h3 className="content-title">{snippet.title}</h3>
                      <p className="content-excerpt">{snippet.description}</p>
                      <div className="content-meta">
                        <span className="content-language">{snippet.language}</span>
                        <span className="content-date">{formatDate(snippet.createdAt)}</span>
                        <span className="content-views">조회 {snippet.viewCount}</span>
                        <span className="content-likes">좋아요 {snippet.likeCount}</span>
                      </div>
                    </Link>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
