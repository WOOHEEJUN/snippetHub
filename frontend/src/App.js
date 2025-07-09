// App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Board from './Board/Board';
import BoardWrite from './Board/BoardWrite';
import BoardDetail from './Board/BoardDetail';
import MyPage from './MyPage/MyPage';
import MyPosts from './MyPage/MyPosts';
import mysnippets from './MyPage/MySnippets';
import ProfileEdit from './MyPage/ProfileEdit';
import SnippetBoard from './SnippetBoard/SnippetBoard';
import SnippetDetail from './SnippetBoard/SnippetDetail';
import SnippetWrite from './SnippetBoard/SnippetWrite';
import CodeTest from './CodeTest/CodeTest';
import MyPostDetail from './MyPage/MyPostDetail';
import MySnippetDetail from './MyPage/MySnippetDetail';


import { AuthProvider, useAuth } from './context/AuthContext';
import './css/App.css';
import MySnippets from './MyPage/MySnippets';

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
        <Link to="/register" className="btn btn-primary">회원가입</Link>
      </div>
    );
  }

  return (
    <div className="auth-status d-flex align-items-center gap-2">
      <span>안녕하세요, {user.nickname || user.email}님!</span>
      <Link to="/mypage" className="btn btn-outline-primary">마이페이지</Link>
       <Link to="/code-test" className="btn btn-outline-success">코드 테스트</Link>
      <button onClick={() => {
        logout();
        navigate('/login');
        }} className="btn btn-outline-danger">로그아웃</button>
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
  <Route path="/board" element={<Board />} />
  <Route path="/board/write" element={<BoardWrite />} />
 <Route path="/board/:postId" element={<BoardDetail />} />
  <Route path="/mypage" element={<MyPage />} />
<Route path="/mypage/posts" element={<MyPosts />} />
  <Route path="/mypage/snippets" element={<MySnippets />} />
  <Route path="/mypage/edit" element={<ProfileEdit />} />
  <Route path="/snippets" element={<SnippetBoard />} />
  <Route path="/snippets/:snippetId" element={<SnippetDetail />} />
  <Route path="/snippets/write" element={<SnippetWrite />} />
  <Route path="/code-test" element={<CodeTest />} />
  <Route path="/mypage/posts/:postId" element={<MyPostDetail />} />
  <Route path="/mypage/snippets/:snippetId" element={<MySnippetDetail />} />
</Routes>

        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;