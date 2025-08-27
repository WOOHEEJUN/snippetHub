import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaFileAlt, FaCode, FaComment, FaHeart, FaEye } from 'react-icons/fa';
 
import '../css/UserProfile.css';
import { getRepresentativeBadgeImage, getLevelBadgeImage } from '../utils/badgeUtils';

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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  if (loading) return <div className="user-profile-container"><div className="loading">로딩 중...</div></div>;
  if (error) return <div className="user-profile-container"><div className="error">{error}</div></div>;
  if (!user) return <div className="user-profile-container"><div className="error">사용자를 찾을 수 없습니다.</div></div>;

  return (
    <div className="user-profile-container">
      <div className="profile-header">
        <div className="profile-level-display">
          {user.representativeBadge ? (
            <img
              src={getRepresentativeBadgeImage(user.representativeBadge)}
              alt={user.representativeBadge.name}
              className="profile-level-badge-large"
            />
          ) : (
            user.level && (
              <img
                src={getLevelBadgeImage(user.level)}
                alt={user.level}
                className="profile-level-badge-large"
              />
            )
          )}
        </div>
        <div className="profile-info">
          <h1 className="profile-nickname">{user.nickname}</h1>
          {user.levelName && user.level && <p className="profile-level">등급: {user.levelName} (Lv.{user.level})</p>}
          {user.points !== undefined && <p className="profile-points">포인트: {user.points} P</p>}
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
                      <p className="content-excerpt">{(post.content || '').substring(0, 100)}...</p>
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
