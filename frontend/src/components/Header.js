// src/components/Header.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import {
  getRepresentativeBadgeImage,
  getBadgeRarity,
  getLevelBadgeImage,
  getUserLevel,
} from '../utils/badgeUtils';
import '../css/Header.css';

/* 닉네임 앞 대표뱃지 칩
   - 이미지가 커지는 걸 막기 위해 wrapper와 img에 width/height를 inline으로도 강제 고정 */
const RepBadge = ({ badge, size = 22 }) => {
  if (!badge) return null;
  const src = getRepresentativeBadgeImage(badge);
  const rarity = getBadgeRarity(badge); // 필요하면 클래스 스타일링에 활용

  const boxStyle = {
    width: size,
    height: size,
    minWidth: size,
    minHeight: size,
    maxWidth: size,
    maxHeight: size,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    overflow: 'hidden',
    verticalAlign: 'middle',
    marginRight: 6,
  };
  const imgStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    display: 'block',
  };

  return (
    <span className={`rep-badge-chip rarity-${rarity}`} style={boxStyle} title={badge?.name || '대표 뱃지'}>
      <img
        src={src}
        alt={badge?.name || 'badge'}
        style={imgStyle}
        onError={(e) => { e.currentTarget.src = '/badges/placeholder.png'; }}
      />
    </span>
  );
};

const Header = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout, user, loading } = useAuth();
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);

  const handleLogout = () => {
    logout();
    alert('로그아웃 되었습니다.');
    navigate('/');
  };
  const toggleHamburger = () => setIsHamburgerOpen((v) => !v);

  if (loading) return <p>Loading...</p>;

  // 대표 뱃지가 있으면 그걸, 없으면 등급 PNG
  const repBadge = user?.representativeBadge ?? user?.data?.representativeBadge ?? null;
  const userLevel = getUserLevel(user);
  const levelImg = !repBadge ? getLevelBadgeImage(userLevel) : '';

  return (
    <header className="header">
      <div className="header-container">
        {/* LEFT */}
        <div className="header-left">
          <Link to="/" className="logo">
            <img src="/Logo.png" alt="SNI Logo" className="header-logo-img" />
          </Link>

          <nav className="main-nav">
            <ul className="nav-menu-horizontal">
              <li className="nav-item">
                <span className="nav-link-main">게시판</span>
                <ul className="submenu">
                  <li><Link to="/board">게시판 모아보기</Link></li>
                  <li><Link to="/board?category=GENERAL">자유 게시판</Link></li>
                  <li><Link to="/board?category=QNA">Q&A 게시판</Link></li>
                  <li><Link to="/board?category=INFO">정보 게시판</Link></li>
                </ul>
              </li>

              <li className="nav-item">
                <span className="nav-link-main">문제풀이</span>
                <ul className="submenu">
                  <li><Link to="/problems">코딩문제</Link></li>
                  <li><Link to="/daily-problems">일일문제</Link></li>
                  <li><Link to="/ai-problem-generation">AI 문제 생성</Link></li>
                  <li><Link to="/ai-code-evaluation">AI 코드 평가</Link></li>
                </ul>
              </li>

              <li className="nav-item">
                <span className="nav-link-main">스니펫</span>
                <ul className="submenu">
                  <li><Link to="/snippets">스니펫 모아보기</Link></li>
                  <li><Link to="/snippets?language=C&sort=LATEST&page=0">C</Link></li>
                  <li><Link to="/snippets?language=JavaScript&sort=LATEST&page=0">JavaScript</Link></li>
                  <li><Link to="/snippets?language=Python&sort=LATEST&page=0">Python</Link></li>
                  <li><Link to="/snippets?language=HTML&sort=LATEST&page=0">HTML</Link></li>
                  <li><Link to="/snippets?language=Java&sort=LATEST&page=0">Java</Link></li>
                </ul>
              </li>

              <li className="nav-item">
                <span className="nav-link-main">마이페이지</span>
                <ul className="submenu">
                  <li><Link to="/mypage">마이페이지</Link></li>
                  <li><Link to="/mypage/badges">등급보기</Link></li>
                  <li><Link to="/mypage/edit">개인정보수정</Link></li>
                  <li><Link to="/mypage/ranking">랭킹보기</Link></li>
                  <li><Link to="/mypage/badge-guide">뱃지 가이드</Link></li>
                  <li><Link to="/mypage/submission-history">제출 내역</Link></li>
                  <li><Link to="/mypage/posts">게시물 목록 보기</Link></li>
                  <li><Link to="/mypage/snippets">스니펫 목록 보기</Link></li>
                  <li><Link to="/mypage/saved-problems">저장한 문제보기</Link></li>
                </ul>
              </li>
            </ul>
          </nav>
        </div>

        {/* RIGHT */}
        <div className="header-right">
          <div className="auth-buttons">
            {!isAuthenticated ? (
              <>
                <Link to="/login" className="btn btn-outline-primary">로그인</Link>
                <Link to="/register" className="btn btn-primary">회원가입</Link>
              </>
            ) : (
              <>
                <NotificationBell />
                <span className="user-info">
                  {/* 1) 대표뱃지 있으면 → 대표뱃지 */}
                  {repBadge && <RepBadge badge={repBadge} size={22} />}
                  {/* 2) 없으면 → 등급 PNG */}
                  {!repBadge && levelImg && (
                    <img
                      src={levelImg}
                      alt={`${userLevel ?? ''} 등급`}
                      className="level-badge-header"
                      style={{
                        width: 22, height: 22,
                        minWidth: 22, minHeight: 22,
                        maxWidth: 22, maxHeight: 22,
                        objectFit: 'contain', marginRight: 6, verticalAlign: 'middle',
                      }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  )}
                  안녕하세요, {user?.nickname || user?.email}님!
                </span>
                <Link to="/mypage" className="btn btn-outline-primary">마이페이지</Link>
                <button onClick={handleLogout} className="btn btn-primary">로그아웃</button>
              </>
            )}
          </div>

          <div className="hamburger-container">
            <button
              className={`hamburger-btn ${isHamburgerOpen ? 'active' : ''}`}
              onClick={toggleHamburger}
              aria-label="메뉴 열기"
            >
              <span></span><span></span><span></span>
            </button>

            {isHamburgerOpen && (
              <div className="hamburger-dropdown">
                {/* 필요하면 여기에 모바일 드롭다운 섹션들 추가 */}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
