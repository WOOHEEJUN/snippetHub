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
  
  // 필터 상태
  const [selectedDifficulty, setSelectedDifficulty] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('latest'); // latest, difficulty, success_rate

  useEffect(() => {
    fetchProblems();
  }, [selectedDifficulty, selectedCategory, sortBy]);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      
      // 백엔드 API가 준비되지 않은 경우를 위한 임시 데이터
      if (process.env.NODE_ENV === 'development') {
        setTimeout(() => {
          const mockProblems = [
            {
              problemId: 1,
              title: '[임시 데이터] 배열의 합 구하기',
              description: '[임시 데이터] 주어진 배열의 모든 요소의 합을 구하는 문제입니다. (실제 문제 데이터는 백엔드 구현 필요)',
              difficulty: 'EASY',
              category: 'ALGORITHM',
              totalSubmissions: 150,
              successRate: 0.85,
              timeLimit: 1000
            },
            {
              problemId: 2,
              title: '[임시 데이터] 문자열 뒤집기',
              description: '[임시 데이터] 주어진 문자열을 뒤집는 문제입니다.',
              difficulty: 'EASY',
              category: 'STRING',
              totalSubmissions: 120,
              successRate: 0.92,
              timeLimit: 1000
            },
            {
              problemId: 3,
              title: '[임시 데이터] 피보나치 수열',
              description: '[임시 데이터] n번째 피보나치 수를 구하는 문제입니다.',
              difficulty: 'MEDIUM',
              category: 'ALGORITHM',
              totalSubmissions: 80,
              successRate: 0.75,
              timeLimit: 1000
            },
            {
              problemId: 4,
              title: '[임시 데이터] 이진 탐색',
              description: '[임시 데이터] 정렬된 배열에서 특정 값을 찾는 문제입니다.',
              difficulty: 'MEDIUM',
              category: 'ALGORITHM',
              totalSubmissions: 95,
              successRate: 0.68,
              timeLimit: 1000
            },
            {
              problemId: 5,
              title: '[임시 데이터] 최단 경로 찾기',
              description: '[임시 데이터] 그래프에서 두 정점 간의 최단 경로를 찾는 문제입니다.',
              difficulty: 'HARD',
              category: 'GRAPH',
              totalSubmissions: 45,
              successRate: 0.55,
              timeLimit: 2000
            }
          ];
          
          // 필터링 적용
          let filteredProblems = mockProblems;
          
          if (selectedDifficulty !== 'ALL') {
            filteredProblems = filteredProblems.filter(p => p.difficulty === selectedDifficulty);
          }
          
          if (selectedCategory !== 'ALL') {
            filteredProblems = filteredProblems.filter(p => p.category === selectedCategory);
          }
          
          if (searchQuery) {
            filteredProblems = filteredProblems.filter(p => 
              p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
          }
          
          // 정렬 적용
          if (sortBy === 'difficulty') {
            const difficultyOrder = { 'EASY': 1, 'MEDIUM': 2, 'HARD': 3 };
            filteredProblems.sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]);
          } else if (sortBy === 'success_rate') {
            filteredProblems.sort((a, b) => b.successRate - a.successRate);
          } else {
            // latest (기본값)
            filteredProblems.sort((a, b) => b.problemId - a.problemId);
          }
          
          setProblems(filteredProblems);
          setLoading(false);
        }, 1000);
        return;
      }

      const params = new URLSearchParams();
      
      if (selectedDifficulty !== 'ALL') params.append('difficulty', selectedDifficulty);
      if (selectedCategory !== 'ALL') params.append('category', selectedCategory);
      if (searchQuery) params.append('search', searchQuery);
      params.append('sort', sortBy);
      
      const response = await fetch(`/api/problems?${params.toString()}`, {
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('문제 목록을 불러오는 중 오류가 발생했습니다.');
      }

      const data = await response.json();
      setProblems(data.data || []);
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
          <h1>💻 코딩 문제</h1>
          <p>다양한 알고리즘 문제를 풀어보고 실력을 향상시켜보세요!</p>
          
        </div>

        {/* 검색 및 필터 섹션 */}
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

        {/* 문제 목록 */}
        <div className="problems-grid">
          {problems.length === 0 ? (
            <div className="no-problems">
              <FaCode className="no-problems-icon" />
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

        {/* 문제 생성 링크 */}
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