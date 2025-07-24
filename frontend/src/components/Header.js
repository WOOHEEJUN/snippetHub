import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../css/Header.css';

const Header = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    alert('로그아웃 되었습니다.');
    navigate('/');
  };

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          <span>SNI</span><span>PET</span>
        </Link>
        <nav className="nav-list">
          <NavLink to="/snippets" className="nav-link">스니펫</NavLink>
          <NavLink to="/board" className="nav-link">게시판</NavLink>
        </nav>
        <div className="auth-buttons">
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="btn btn-outline-primary">로그인</Link>
              <Link to="/register" className="btn btn-primary">회원가입</Link>
            </>
          ) : (
            <>
              <Link to="/mypage" className="btn btn-outline-primary">마이페이지</Link>
              <button onClick={handleLogout} className="btn btn-primary">로그아웃</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;