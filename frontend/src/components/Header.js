import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../css/App.css'; // 스타일 적용

const Header = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    alert('로그아웃 되었습니다.');
    navigate('/');
  };

  return (
    <header className="header">
      <div className="container d-flex justify-content-between align-items-center">
        {/* 왼쪽: 로고 + 메뉴 */}
        <div className="d-flex align-items-center gap-4">
          <Link to="/" className="logo">
            <span>SNI</span><span>스니펫</span>
          </Link>
          <nav>
            <ul className="nav-list">
              <li><Link to="/snippets">스니펫</Link></li>
              <li><Link to="/board">게시판</Link></li>
            </ul>
          </nav>
        </div>

        {/* 오른쪽: 로그인/회원가입 or 마이페이지/로그아웃 */}
        <div className="auth-buttons">
          {!token ? (
            <>
              <Link to="/login" className="btn-login">로그인</Link>
              <Link to="/register" className="btn-signup">회원가입</Link>
            </>
          ) : (
            <>
              <Link to="/mypage" className="btn-login">마이페이지</Link>
              <button onClick={handleLogout} className="btn-signup">로그아웃</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
