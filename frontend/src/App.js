// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate } from 'react-router-dom';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Board from './Board/Board';
import BoardWrite from './Board/BoardWrite';
import BoardDetail from './Board/BoardDetail';
import BoardEdit from './Board/BoardEdit';
import MyPage from './MyPage/MyPage';
import MyPosts from './MyPage/MyPosts';
import MySnippets from './MyPage/MySnippets';
import ProfileEdit from './MyPage/ProfileEdit';
import SnippetBoard from './SnippetBoard/SnippetBoard';
import SnippetDetail from './SnippetBoard/SnippetDetail';
import SnippetWrite from './SnippetBoard/SnippetWrite';
import SnippetEdit from './SnippetBoard/SnippetEdit';
import CodeTest from './CodeTest/CodeTest';
import OAuth2Callback from './pages/OAuth2Callback';
import Notifications from './pages/Notifications';
import UserProfile from './pages/UserProfile';
import AIProblemGeneration from './pages/AIProblemGeneration';
import AICodeEvaluation from './pages/AICodeEvaluation';
import DailyProblem from './pages/DailyProblem';
import SubmissionHistory from './pages/SubmissionHistory';
import BadgeGuide from './pages/BadgeGuide';
import GradeGuide from './pages/GradeGuide';
import ProblemList from './pages/ProblemList';
import ProblemDetail from './pages/ProblemDetail';
import PointHistory from './pages/PointHistory';

import SavedProblems from './MyPage/SavedProblems';
import NotificationBell from './components/NotificationBell';
<<<<<<< HEAD
import Header from './components/Header';
=======
import NavDropdown from './components/NavDropdown';

>>>>>>> a4402f3f37885a239a7fd822d6c93568aadf704d
import { AuthProvider, useAuth } from './context/AuthContext';
import { getLevelBadgeImage } from './utils/badgeUtils';
import './css/App.css';

// 누락된 마이페이지 하위 페이지
import MyBadges from './MyPage/MyBadges';
import Ranking from './MyPage/Ranking';
import PointsGuide from './MyPage/PointsGuide';

<<<<<<< HEAD
=======
const AuthStatus = () => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return <p>Loading...</p>;

  if (!user) {
    return (
      <div className="auth-status d-flex align-items-center gap-3">
        <Link to="/login" className="btn-gray">로그인</Link>
        <Link to="/register" className="btn-gray">회원가입</Link>
      </div>
    );
  }

  return (
    <div className="auth-status d-flex align-items-center gap-3">
      {/* 알림 벨 아이콘 (페이지 이동은 컴포넌트 내부에서 처리한다고 가정) */}
      <NotificationBell />
      <span>
        {user.level && (
          <img
            src={getLevelBadgeImage(user.level)}
            alt={user.level}
            className="level-badge-header"
          />
        )}
        안녕하세요, {user.nickname || user.email}님!
      </span>
      <Link to="/mypage" className="btn-gray">마이페이지</Link>
      <button
        onClick={() => {
          logout();
          navigate('/login');
        }}
        className="btn-gray"
      >
        로그아웃
      </button>
    </div>
  );
};

>>>>>>> a4402f3f37885a239a7fd822d6c93568aadf704d
function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
<<<<<<< HEAD
          <Header />
=======
          <nav className="nav-container">
            <div className="container">
              <div className="d-flex justify-content-between align-items-center w-100">
                {/* 왼쪽: 로고 + 드롭다운 메뉴 */}
                <div className="d-flex align-items-center" style={{ gap: '30px' }}>
                  <Link to="/" className="text-decoration-none">
                    <h3 className="mb-0">SNI</h3>
                  </Link>

                  {/* 제어형 드롭다운 (외부 클릭/라우트 변경/ESC로 닫힘) */}
                  <NavDropdown />
                </div>

                {/* 오른쪽: 인증 영역 */}
                <AuthStatus />
              </div>
            </div>
          </nav>
>>>>>>> a4402f3f37885a239a7fd822d6c93568aadf704d

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/board" element={<Board />} />
            <Route path="/board/write" element={<BoardWrite />} />
            <Route path="/board/:postId" element={<BoardDetail />} />
            <Route path="/board/edit/:postId" element={<BoardEdit />} />

            <Route path="/snippets" element={<SnippetBoard />} />
            <Route path="/snippets/write" element={<SnippetWrite />} />
            <Route path="/snippets/:snippetId" element={<SnippetDetail />} />
            <Route path="/snippets/edit/:snippetId" element={<SnippetEdit />} />

            <Route path="/code-test" element={<CodeTest />} />

            <Route path="/ai-problem-generation" element={<AIProblemGeneration />} />
            <Route path="/ai-code-evaluation" element={<AICodeEvaluation />} />

            <Route path="/daily-problems" element={<DailyProblem />} />
            <Route path="/submission-history" element={<SubmissionHistory />} />

            <Route path="/problems" element={<ProblemList />} />
            <Route path="/problems/:problemId" element={<ProblemDetail />} />

            <Route path="/badge-guide" element={<BadgeGuide />} />
            <Route path="/grade-guide" element={<GradeGuide />} />
            <Route path="/point-history" element={<PointHistory />} />

            {/* 마이페이지 섹션 */}
            <Route path="/mypage" element={<MyPage />} />
            <Route path="/mypage/posts" element={<MyPosts />} />
            <Route path="/mypage/snippets" element={<MySnippets />} />
            <Route path="/mypage/edit" element={<ProfileEdit />} />
            <Route path="/mypage/badges" element={<MyBadges />} />
            <Route path="/mypage/ranking" element={<Ranking />} />
            <Route path="/mypage/points-guide" element={<PointsGuide />} />
            <Route path="/mypage/saved-problems" element={<SavedProblems />} />

            {/* 알림/프로필/OAuth */}
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/users/:userId" element={<UserProfile />} />
            <Route path="/oauth2/callback" element={<OAuth2Callback />} />
            <Route path="/oauth2/redirect" element={<OAuth2Callback />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
