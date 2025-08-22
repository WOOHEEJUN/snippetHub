
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
import Header from './components/Header';
import { AuthProvider, useAuth } from './context/AuthContext';
import { getLevelBadgeImage } from './utils/badgeUtils';
import './css/App.css';


import MyBadges from './MyPage/MyBadges';
import Ranking from './MyPage/Ranking';
import PointsGuide from './MyPage/PointsGuide';
import MyPageLayout from './MyPage/MyPageLayout';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Header />

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/board" element={<Board />} />
            <Route path="/board/write" element={<BoardWrite />} />
            <Route path="/board/:postId" element={<BoardDetail />} />
            <Route path="/board/edit/:postId" element={<BoardEdit />} />
            
            <Route path="/mypage" element={<MyPageLayout />}>
              <Route index element={<MyPage />} />
              <Route path="posts" element={<MyPosts />} />
              <Route path="snippets" element={<MySnippets />} />
              <Route path="edit" element={<ProfileEdit />} />
              <Route path="badges" element={<MyBadges />} />
              <Route path="ranking" element={<Ranking />} />
              <Route path="points-guide" element={<PointsGuide />} />
              <Route path="saved-problems" element={<SavedProblems />} />
              <Route path="submission-history" element={<SubmissionHistory />} />
              <Route path="point-history" element={<PointHistory />} />
            </Route>

            <Route path="/badge-guide" element={<BadgeGuide />} />
            <Route path="/grade-guide" element={<GradeGuide />} />
            <Route path="/snippets" element={<SnippetBoard />} />
            <Route path="/snippets/write" element={<SnippetWrite />} />
            <Route path="/snippets/:snippetId" element={<SnippetDetail />} />
            <Route path="/snippets/edit/:snippetId" element={<SnippetEdit />} />
            <Route path="/code-test" element={<CodeTest />} />
            <Route path="/ai-problem-generation" element={<AIProblemGeneration />} />
            <Route path="/ai-code-evaluation" element={<AICodeEvaluation />} />
            <Route path="/daily-problems" element={<DailyProblem />} />
            <Route path="/problems" element={<ProblemList />} />
            <Route path="/problems/:problemId" element={<ProblemDetail />} />
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
