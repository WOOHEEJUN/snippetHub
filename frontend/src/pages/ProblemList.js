import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaSearch, FaFilter, FaCode, FaClock, FaTrophy, FaUsers } from 'react-icons/fa';
import '../css/ProblemList.css';

const DIFFICULTY_OPTIONS = [
  { value: 'ALL', label: '전체', color: '#6c757d' },
  { value: 'EASY', label: '쉬움', color: '#28a745' },
  { value: 'MEDIUM', label: '보통', color: '#ffc107' },
  { value: 'HARD', label: '어려움', color: '#dc3545' }
];

const CATEGORY_OPTIONS = [
  { value: 'ALL', label: '전체' },
  { value: 'ALGORITHM', label: '알고리즘' },
  { value: 'DATA_STRUCTURE', label: '자료구조' },
  { value: 'STRING', label: '문자열' },
  { value: 'MATH', label: '수학' },
  { value: 'GRAPH', label: '그래프' },
  { value: 'DYNAMIC_PROGRAMMING', label: '동적 프로그래밍' },
  { value: 'GREEDY', label: '그리디' },
  { value: 'BRUTE_FORCE', label: '완전 탐색' }
];

function ProblemList() {
  const { getAuthHeaders } = useAuth();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  
  const [selectedDifficulty, setSelectedDifficulty] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('latest'); 
  
  
  const [recommendedProblems, setRecommendedProblems] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); 

  useEffect(() => {
    fetchProblems();
    fetchRecommendedProblems();
    fetchUserStats();
  }, [selectedDifficulty, selectedCategory, sortBy]);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      
      if (selectedDifficulty !== 'ALL') params.append('difficulty', selectedDifficulty);
      if (selectedCategory !== 'ALL') params.append('category', selectedCategory);
      if (searchQuery) params.append('search', searchQuery);
      
      
      const response = await fetch(`/api/problems?${params.toString()}`, {
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('문제 목록을 불러오는 중 오류가 발생했습니다.');
      }

      const data = await response.json();
      if (data.success && data.data && data.data.content) {
        setProblems(data.data.content);
      } else {
        setProblems([]);
      }
    } catch (err) {
      console.error('문제 목록 불러오기 실패:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProblems();
  };

  const fetchRecommendedProblems = async () => {
    try {
      const response = await fetch('/api/problems/recommended', {
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setRecommendedProblems(data.data);
        }
      }
    } catch (err) {
      console.error('추천 문제 불러오기 실패:', err);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/problems/user-stats', {
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setUserStats(data.data);
        }
      }
    } catch (err) {
      console.error('사용자 통계 불러오기 실패:', err);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const getDifficultyColor = (difficulty) => {
    const option = DIFFICULTY_OPTIONS.find(d => d.value === difficulty);
    return option ? option.color : '#6c757d';
  };

  const getDifficultyLabel = (difficulty) => {
    const option = DIFFICULTY_OPTIONS.find(d => d.value === difficulty);
    return option ? option.label : difficulty;
  };

  const getCategoryLabel = (category) => {
    const option = CATEGORY_OPTIONS.find(c => c.value === category);
    return option ? option.label : category;
  };

  const formatSuccessRate = (rate) => {
    return rate ? `${(rate * 100).toFixed(1)}%` : '0%';
  };

  if (loading) return <div className="loading-message">문제 목록을 불러오는 중...</div>;
  if (error) return <div className="error-message">오류: {error}</div>;

  return (
    <div className="problem-list-page">
      <div className="container">
        <div className="page-header">
          <h1> 코딩 문제</h1>
          <p>다양한 알고리즘 문제를 풀어보고 실력을 향상시켜보세요!</p>
        </div>

        
        <div className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => handleTabChange('all')}
          >
            전체 문제
          </button>
          <button 
            className={`tab-btn ${activeTab === 'recommended' ? 'active' : ''}`}
            onClick={() => handleTabChange('recommended')}
          >
            추천 문제
          </button>
          <button 
            className={`tab-btn ${activeTab === 'progress' ? 'active' : ''}`}
            onClick={() => handleTabChange('progress')}
          >
            학습 진도
          </button>
        </div>

        
        {userStats && (
          <div className="user-stats-section">
            <div className="stats-grid">
              <div className="stat-card">
                <h3>총 해결한 문제</h3>
                <div className="stat-value">{userStats.solvedProblems || 0}개</div>
              </div>
              <div className="stat-card">
                <h3>성공률</h3>
                <div className="stat-value">{userStats.successRate ? `${(userStats.successRate * 100).toFixed(1)}%` : '0%'}</div>
              </div>
              <div className="stat-card">
                <h3>현재 레벨</h3>
                <div className="stat-value">{userStats.currentLevel || 'BRONZE'}</div>
              </div>
              <div className="stat-card">
                <h3>연속 해결</h3>
                <div className="stat-value">{userStats.streak || 0}일</div>
              </div>
            </div>
          </div>
        )}

        
        <div className="search-filter-section">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-group">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="문제 제목이나 내용으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-btn">검색</button>
            </div>
          </form>

          <div className="filter-section">
            <div className="filter-group">
              <label>난이도:</label>
              <div className="filter-buttons">
                {DIFFICULTY_OPTIONS.map(difficulty => (
                  <button
                    key={difficulty.value}
                    onClick={() => setSelectedDifficulty(difficulty.value)}
                    className={`filter-btn ${selectedDifficulty === difficulty.value ? 'active' : ''}`}
                    style={{
                      borderColor: difficulty.color,
                      color: selectedDifficulty === difficulty.value ? 'white' : difficulty.color,
                      backgroundColor: selectedDifficulty === difficulty.value ? difficulty.color : 'transparent'
                    }}
                  >
                    {difficulty.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <label>카테고리:</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="category-select"
              >
                {CATEGORY_OPTIONS.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>정렬:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="latest">최신순</option>
                <option value="difficulty">난이도순</option>
                <option value="success_rate">성공률순</option>
              </select>
            </div>
          </div>
        </div>

        
        {activeTab === 'all' && (
          <div className="problems-grid">
            {problems.length === 0 ? (
              <div className="no-problems">
                <p>조건에 맞는 문제가 없습니다.</p>
              </div>
            ) : (
              problems.map(problem => (
                <Link 
                  key={problem.problemId} 
                  to={`/problems/${problem.problemId}`}
                  className="problem-card"
                >
                  <div className="problem-header">
                    <div className="problem-title">
                      <h3>{problem.title}</h3>
                    </div>
                    <div 
                      className="difficulty-badge"
                      style={{ backgroundColor: getDifficultyColor(problem.difficulty) }}
                    >
                      {getDifficultyLabel(problem.difficulty)}
                    </div>
                  </div>

                  <div className="problem-category">
                    <span className="category-tag">
                      {getCategoryLabel(problem.category)}
                    </span>
                  </div>

                  <div className="problem-stats">
                    <div className="stat-item">
                      <FaUsers className="stat-icon" />
                      <span>{problem.totalSubmissions || 0}명 제출</span>
                    </div>
                    <div className="stat-item">
                      <FaTrophy className="stat-icon" />
                      <span>{formatSuccessRate(problem.successRate)} 성공률</span>
                    </div>
                    <div className="stat-item">
                      <FaClock className="stat-icon" />
                      <span>{problem.timeLimit || 1000}ms</span>
                    </div>
                  </div>

                  {problem.description && (
                    <div className="problem-description">
                      {problem.description.length > 100 
                        ? `${problem.description.substring(0, 100)}...` 
                        : problem.description
                      }
                    </div>
                  )}
                </Link>
              ))
            )}
          </div>
        )}

        
        {activeTab === 'recommended' && (
          <div className="recommended-problems">
            <div className="section-header">
              <h2> 당신에게 추천하는 문제</h2>
              <p>현재 수준과 학습 패턴을 분석하여 맞춤형 문제를 추천해드립니다.</p>
            </div>
            
            {recommendedProblems.length === 0 ? (
              <div className="no-problems">
                <p>추천할 문제가 없습니다. 더 많은 문제를 풀어보세요!</p>
              </div>
            ) : (
              <div className="problems-grid">
                {recommendedProblems.map(problem => (
                  <Link 
                    key={problem.problemId} 
                    to={`/problems/${problem.problemId}`}
                    className="problem-card recommended"
                  >
                    <div className="recommended-badge">추천</div>
                    <div className="problem-header">
                      <div className="problem-title">
                        <h3>{problem.title}</h3>
                      </div>
                      <div 
                        className="difficulty-badge"
                        style={{ backgroundColor: getDifficultyColor(problem.difficulty) }}
                      >
                        {getDifficultyLabel(problem.difficulty)}
                      </div>
                    </div>

                    <div className="problem-category">
                      <span className="category-tag">
                        {getCategoryLabel(problem.category)}
                      </span>
                    </div>

                    <div className="problem-stats">
                      <div className="stat-item">
                        <FaUsers className="stat-icon" />
                        <span>{problem.totalSubmissions || 0}명 제출</span>
                      </div>
                      <div className="stat-item">
                        <FaTrophy className="stat-icon" />
                        <span>{formatSuccessRate(problem.successRate)} 성공률</span>
                      </div>
                      <div className="stat-item">
                        <FaClock className="stat-icon" />
                        <span>{problem.timeLimit || 1000}ms</span>
                      </div>
                    </div>

                    {problem.recommendationReason && (
                      <div className="recommendation-reason">
                        <strong>추천 이유:</strong> {problem.recommendationReason}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        
        {activeTab === 'progress' && (
          <div className="learning-progress">
            <div className="section-header">
              <h2> 학습 진도</h2>
              <p>지금까지의 학습 현황과 다음 목표를 확인해보세요.</p>
            </div>
            
            <div className="progress-overview">
              <div className="progress-stats">
                <div className="progress-item">
                  <h3>난이도별 해결 현황</h3>
                  <div className="difficulty-progress">
                    <div className="progress-bar">
                      <div className="progress-fill easy" style={{width: `${userStats?.easySolved || 0}%`}}></div>
                      <span>쉬움: {userStats?.easySolved || 0}개</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill medium" style={{width: `${userStats?.mediumSolved || 0}%`}}></div>
                      <span>보통: {userStats?.mediumSolved || 0}개</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill hard" style={{width: `${userStats?.hardSolved || 0}%`}}></div>
                      <span>어려움: {userStats?.hardSolved || 0}개</span>
                    </div>
                  </div>
                </div>
                
                <div className="progress-item">
                  <h3>카테고리별 해결 현황</h3>
                  <div className="category-progress">
                    {userStats?.categoryProgress?.map(cat => (
                      <div key={cat.category} className="category-item">
                        <span>{getCategoryLabel(cat.category)}</span>
                        <div className="category-bar">
                          <div 
                            className="category-fill" 
                            style={{width: `${cat.progress}%`}}
                          ></div>
                        </div>
                        <span>{cat.solved}/{cat.total}</span>
                      </div>
                    )) || []}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        
        <div className="create-problem-section">
          <Link to="/ai-problem-generation" className="create-problem-btn">
            <FaCode />
            AI로 문제 생성하기
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ProblemList;