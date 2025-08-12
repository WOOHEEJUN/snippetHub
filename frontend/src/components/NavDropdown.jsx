// src/components/NavDropdown.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function NavDropdown() {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const location = useLocation();

  // 라우트 변경 시 자동 닫기
  useEffect(() => { setOpen(false); }, [location.pathname]);

  // 외부 클릭 닫기
  useEffect(() => {
    function onDocClick(e) {
      if (!open) return;
      if (
        btnRef.current && !btnRef.current.contains(e.target) &&
        menuRef.current && !menuRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  // ESC 닫기
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') setOpen(false); }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const onToggle = () => setOpen(v => !v);
  const onItemClick = () => setOpen(false);

  return (
    <div className={`nav-dropdown ${open ? 'open' : ''}`}>
      <button
        ref={btnRef}
        className="nav-summary"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={onToggle}
      >
        메뉴 ▾
      </button>

      <ul
        ref={menuRef}
        className="nav-menu"
        role="menu"
        aria-hidden={!open}
      >
        <li role="none"><Link role="menuitem" to="/snippets" onClick={onItemClick}>스니펫</Link></li>
        <li role="none"><Link role="menuitem" to="/board" onClick={onItemClick}>게시판</Link></li>
        <li role="none"><Link role="menuitem" to="/problems" onClick={onItemClick}>코딩 문제</Link></li>
        <li role="none"><Link role="menuitem" to="/daily-problems" onClick={onItemClick}>일일 문제</Link></li>
        <li role="none"><Link role="menuitem" to="/ai-problem-generation" onClick={onItemClick}>AI 문제 생성</Link></li>
        <li role="none"><Link role="menuitem" to="/ai-code-evaluation" onClick={onItemClick}>AI 코드 평가</Link></li>
        <li role="none"><Link role="menuitem" to="/badge-guide" onClick={onItemClick}>뱃지 가이드</Link></li>
      </ul>
    </div>
  );
}
