import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import { AuthProvider, useAuth } from './context/AuthContext';
import './css/App.css';

const AuthStatus = () => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return (
      <div className="auth-status">
        <Link to="/login" className="btn btn-primary">로그인</Link>
      </div>
    );
  }

  return (
    <div className="auth-status">
      <span>안녕하세요, {user.nickname || user.email}님!</span>
      <button onClick={() => logout()}>로그아웃</button>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <nav className="nav-container">
            <div className="container">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <Link to="/" className="text-decoration-none">
                    <h3 className="mb-0">SNI</h3>
                  </Link>
                </div>
                <ul className="nav-list d-flex align-items-center">
                  <li>
                    <Link to="/snippets">스니펫</Link>
                  </li>
                  <li>
                    <Link to="/board">게시판</Link>
                  </li>
                  <li>
                    <Link to="/register">회원가입</Link>
                  </li>
                </ul>
                <AuthStatus />
              </div>
            </div>
          </nav>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
