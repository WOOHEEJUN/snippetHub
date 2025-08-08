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
import ProblemList from './pages/ProblemList';
import ProblemDetail from './pages/ProblemDetail';
import PointHistory from './pages/PointHistory';
import SavedProblems from './MyPage/SavedProblems';
import NotificationBell from './components/NotificationBell';
import { AuthProvider, useAuth } from './context/AuthContext';
import { getLevelBadgeImage } from './utils/badgeUtils';
import './css/App.css';

// 🚀 누락된 컴포넌트 임포트
import MyBadges from './MyPage/MyBadges';
import Ranking from './MyPage/Ranking';
import PointsGuide from './MyPage/PointsGuide';

// 🛠 파일이 아직 없다면 아래 주석 풀고 간단히 테스트용 컴포넌트 넣기
// export default function MyBadges() { return <div>MyBadges placeholder</div>; }
// export default function Ranking() { return <div>Ranking placeholder</div>; }
// export default function PointsGuide() { return <div>PointsGuide placeholder</div>; }

const AuthStatus = () => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return <p>Loading...</p>;

  if (!user) {
    return (
      <div className="auth-status d-flex align-items-center gap-3">
        <Link to="/login" className="custom-btn-sm">로그인</Link>
        <Link to="/register" className="custom-btn-sm">회원가입</Link>
      </div>
    );
  }
  return (
    <div className="auth-status d-flex align-items-center gap-3">
      <Notifications />
      <span>
        {user.level && <img src={getLevelBadgeImage(user.level)} alt={user.level} className="level-badge-header" />}
        안녕하세요, {user.nickname || user.email}님!
      </span>
      <Link to="/mypage" className="btn btn-outline-primary">마이페이지</Link>
      <button
        onClick={() => {
          logout();
          navigate('/login');
        }}
        className="btn btn-outline-danger"
      >
        로그아웃
      </button>
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
              <div className="d-flex justify-content-between align-items-center w-100">
                <div className="d-flex align-items-center" style={{ gap: '30px' }}>
                  <Link to="/" className="text-decoration-none">
                    <h3 className="mb-0">SNI</h3>
                  </Link>
                  <ul className="nav-list d-flex align-items-center" style={{ gap: '20px', listStyle: 'none', margin: 0 }}>
                    <li><Link to="/snippets">스니펫</Link></li>
                    <li><Link to="/board">게시판</Link></li>
                    <li><Link to="/problems">코딩 문제</Link></li>
                    <li><Link to="/daily-problems">일일 문제</Link></li>
                    <li><Link to="/ai-problem-generation">AI 문제 생성</Link></li>
                    <li><Link to="/ai-code-evaluation">AI 코드 평가</Link></li>
                    <li><Link to="/badge-guide">뱃지 가이드</Link></li>
                  </ul>
                </div>
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
            <Route path="/board/edit/:postId" element={<BoardEdit />} />
            <Route path="/mypage" element={<MyPage />} />
            <Route path="/mypage/posts" element={<MyPosts />} />
            <Route path="/mypage/snippets" element={<MySnippets />} />
            <Route path="/mypage/edit" element={<ProfileEdit />} />
            <Route path="/mypage/badges" element={<MyBadges />} />
            <Route path="/mypage/ranking" element={<Ranking />} />
            <Route path="/mypage/points-guide" element={<PointsGuide />} />
            <Route path="/mypage/saved-problems" element={<SavedProblems />} />
            <Route path="/badge-guide" element={<BadgeGuide />} />
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
            <Route path="/point-history" element={<PointHistory />} />
            <Route path="/oauth2/callback" element={<OAuth2Callback />} />
            <Route path="/oauth2/redirect" element={<OAuth2Callback />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/users/:userId" element={<UserProfile />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
