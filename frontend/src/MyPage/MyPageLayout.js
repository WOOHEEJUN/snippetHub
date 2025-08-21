import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import '../css/MyPageLayout.css';

const MyPageLayout = () => {
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
    <div className="mypage-layout-container">
      <aside className="mypage-sidebar">
        <h2 className="sidebar-title">마이페이지</h2>
        <nav className="sidebar-nav">
          <ul>
            {sidebarNavLinks.map(link => (
              <li key={link.to}>
                <NavLink to={link.to} end={link.end}>
                  {link.text}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <main className="mypage-content">
        <Outlet />
      </main>
    </div>
  );
};

export default MyPageLayout;
