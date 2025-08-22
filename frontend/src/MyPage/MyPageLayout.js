import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import '../css/MyPageLayout.css';

const MyPageLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setIsSidebarOpen(false); // 데스크톱은 항상 펼쳐져 보이므로 상태 초기화
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // 모바일에서 열렸을 때 바디 스크롤 잠금
  useEffect(() => {
    if (isMobile && isSidebarOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobile, isSidebarOpen]);

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

  const sidebarNavLinks = [
    { to: "/mypage", text: "마이페이지 홈", end: true },
    { to: "/mypage/edit", text: "개인정보 수정" },
    { to: "/mypage/badges", text: "내 등급 및 뱃지" },
    { to: "/mypage/posts", text: "내 게시물" },
    { to: "/mypage/snippets", text: "내 스니펫" },
    { to: "/mypage/saved-problems", text: "저장한 문제" },
    { to: "/mypage/submission-history", text: "제출 내역" },
    { to: "/mypage/point-history", text: "포인트 내역" },
    { to: "/mypage/ranking", text: "전체 랭킹" },
  ];

  return (
    <div className={`mypage-layout-container ${isSidebarOpen && isMobile ? 'sidebar-open' : ''}`}>
      
      

      {/* 사이드바: 모바일은 토글, 데스크탑은 항상 보임 */}
      {(isSidebarOpen || !isMobile) && (
        <aside className={`mypage-sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <h2 className="sidebar-title">마이페이지</h2>
          <nav className="sidebar-nav">
            <ul>
              {sidebarNavLinks.map(link => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    end={link.end}
                    onClick={isMobile ? toggleSidebar : undefined}
                  >
                    {link.text}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      )}

      <main className="mypage-content">
        {/* 화살표 버튼: DOM에는 항상 렌더링. 표시 여부는 CSS 미디어쿼리로 모바일만 */}
        <button
          type="button"
          className={`mypage-hamburger-btn ${isSidebarOpen ? 'open' : ''}`}
          onClick={toggleSidebar}
          aria-label={isSidebarOpen ? '사이드바 닫기' : '사이드바 열기'}
        >
          <span className="icon-stage">
            {isSidebarOpen ? (
              <FaChevronLeft className="chev chev-left" />
            ) : (
              <FaChevronRight className="chev chev-right" />
            )}
          </span>
        </button>

        <Outlet />
      </main>
    </div>
  );
};

export default MyPageLayout;
