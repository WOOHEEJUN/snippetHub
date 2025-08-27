import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import UserBadgeAndNickname from './UserBadgeAndNickname'; // Correct import

import '../css/Header.css';

// RepBadge component definition removed

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

  // Move conditional rendering after all hooks
  // if (loading) return <p>Loading...</p>; // This line should be moved or removed if not needed

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
                  안녕하세요, <UserBadgeAndNickname user={user} showLink={false} />님!
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
                <div className="hamburger-menu-section">
                  <h4>게시판</h4>
                  <ul>
                    <li><Link to="/board" onClick={toggleHamburger}>게시판 모아보기</Link></li>
                    <li><Link to="/board?category=GENERAL" onClick={toggleHamburger}>자유 게시판</Link></li>
                    <li><Link to="/board?category=QNA" onClick={toggleHamburger}>Q&A 게시판</Link></li>
                    <li><Link to="/board?category=INFO" onClick={toggleHamburger}>정보 게시판</Link></li>
                  </ul>
                </div>

                <div className="hamburger-menu-section">
                  <h4>문제풀이</h4>
                  <ul>
                    <li><Link to="/problems" onClick={toggleHamburger}>코딩문제</Link></li>
                    <li><Link to="/daily-problems" onClick={toggleHamburger}>일일문제</Link></li>
                    <li><Link to="/ai-problem-generation" onClick={toggleHamburger}>AI 문제 생성</Link></li>
                    <li><Link to="/ai-code-evaluation" onClick={toggleHamburger}>AI 코드 평가</Link></li>
                  </ul>
                </div>

                <div className="hamburger-menu-section">
                  <h4>스니펫</h4>
                  <ul>
                    <li><Link to="/snippets" onClick={toggleHamburger}>스니펫 모아보기</Link></li>
                    <li><Link to="/snippets?language=C&sort=LATEST&page=0" onClick={toggleHamburger}>C</Link></li>
                    <li><Link to="/snippets?language=JavaScript&sort=LATEST&page=0" onClick={toggleHamburger}>JavaScript</Link></li>
                    <li><Link to="/snippets?language=Python&sort=LATEST&page=0" onClick={toggleHamburger}>Python</Link></li>
                    <li><Link to="/snippets?language=HTML&sort=LATEST&page=0" onClick={toggleHamburger}>HTML</Link></li>
                    <li><Link to="/snippets?language=Java&sort=LATEST&page=0" onClick={toggleHamburger}>Java</Link></li>
                  </ul>
                </div>

                {isAuthenticated ? (
                  <div className="hamburger-menu-section">
                    <h4>마이페이지</h4>
                    <ul>
                      <li><Link to="/mypage" onClick={toggleHamburger}>마이페이지</Link></li>
                      <li><Link to="/mypage/badges" onClick={toggleHamburger}>등급보기</Link></li>
                      <li><Link to="/mypage/edit" onClick={toggleHamburger}>개인정보수정</Link></li>
                      <li><Link to="/mypage/ranking" onClick={toggleHamburger}>랭킹보기</Link></li>
                      <li><Link to="/mypage/badge-guide" onClick={toggleHamburger}>뱃지 가이드</Link></li>
                      <li><Link to="/mypage/submission-history" onClick={toggleHamburger}>제출 이력</Link></li>
                      <li><Link to="/mypage/posts" onClick={toggleHamburger}>게시물 목록 보기</Link></li>
                      <li><Link to="/mypage/snippets" onClick={toggleHamburger}>스니펫 목록 보기</Link></li>
                      <li><Link to="/mypage/saved-problems">저장한 문제보기</Link></li>
                      <li>
                        <button
                          onClick={() => { handleLogout(); toggleHamburger(); }}
                          className="btn btn-primary"
                        >
                          로그아웃
                        </button>
                      </li>
                    </ul>
                  </div>
                ) : (
                  <div className="hamburger-menu-section">
                    <h4>계정</h4>
                    <ul>
                      <li><Link to="/login" onClick={toggleHamburger}>로그인</Link></li>
                      <li><Link to="/register" onClick={toggleHamburger}>회원가입</Link></li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;