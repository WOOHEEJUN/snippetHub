import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../css/Home.css';

import { useAuth } from '../context/AuthContext'; // AuthContext import 추가

// 더미 데이터 정의
const dummySnippets = [
  {
    snippetId: 1,
    language: 'JAVASCRIPT',
    createdAt: new Date().toISOString(),
    title: 'JavaScript 배열 중복 제거',
    description: 'Set을 사용하여 JavaScript 배열에서 중복된 항목을 제거하는 간단한 방법입니다.',
    author: { nickname: 'DummyUser1' },
    likeCount: 128,
  },
  {
    snippetId: 2,
    language: 'PYTHON',
    createdAt: new Date().toISOString(),
    title: 'Python 리스트 뒤집기',
    description: '슬라이싱을 사용하여 Python 리스트를 뒤집는 효율적인 방법입니다.',
    author: { nickname: 'CodeMaster' },
    likeCount: 99,
  },
  {
    snippetId: 3,
    language: 'JAVA',
    createdAt: new Date().toISOString(),
    title: 'Java 문자열 포맷팅',
    description: 'String.format() 메서드를 사용하여 Java에서 문자열을 깔끔하게 포맷팅합니다.',
    author: { nickname: 'JavaGod' },
    likeCount: 76,
  },
    {
    snippetId: 4,
    language: 'HTML',
    createdAt: new Date().toISOString(),
    title: 'HTML 시맨틱 태그',
    description: '웹 접근성과 SEO를 개선하는 시맨틱 HTML 태그 사용법 예제입니다.',
    author: { nickname: 'WebDev' },
    likeCount: 64,
  },
  {
    snippetId: 5,
    language: 'CSS',
    createdAt: new Date().toISOString(),
    title: 'CSS Flexbox 중앙 정렬',
    description: 'Flexbox를 사용하여 요소를 수직 및 수평 중앙에 정렬하는 방법을 보여줍니다.',
    author: { nickname: 'StyleQueen' },
    likeCount: 55,
  },
  {
    snippetId: 6,
    language: 'C',
    createdAt: new Date().toISOString(),
    title: 'C언어 포인터 기초',
    description: 'C언어에서 포인터의 개념과 기본 사용법을 설명하는 코드입니다.',
    author: { nickname: 'SystemHacker' },
    likeCount: 42,
  },
];

const dummyPosts = [
  {
    postId: 1,
    title: '리액트 Hooks, 언제 사용해야 할까요?',
    createdAt: new Date().toISOString(),
    author: { nickname: 'ReactFan' },
    viewCount: 1024,
    likeCount: 58,
  },
  {
    postId: 2,
    title: '개발자 취업 준비 팁 공유합니다.',
    createdAt: new Date().toISOString(),
    author: { nickname: 'JobSeeker' },
    viewCount: 2048,
    likeCount: 123,
  },
  {
    postId: 3,
    title: '코딩 테스트, 다들 어떻게 준비하시나요?',
    createdAt: new Date().toISOString(),
    author: { nickname: 'AlgoKing' },
    viewCount: 1536,
    likeCount: 99,
  },
  {
    postId: 4,
    title: '새로운 사이드 프로젝트 시작했습니다!',
    createdAt: new Date().toISOString(),
    author: { nickname: 'ProjectLover' },
    viewCount: 876,
    likeCount: 45,
  },
  {
    postId: 5,
    title: '좋아하는 개발 유튜버 있으신가요?',
    createdAt: new Date().toISOString(),
    author: { nickname: 'CuriousDev' },
    viewCount: 998,
    likeCount: 77,
  },
];


const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // useAuth 훅을 사용하여 user 객체 가져오기
  const isLoggedIn = !!user; // user 객체의 존재 여부로 로그인 상태 판단

  const [popularSnippets, setPopularSnippets] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLanguage, setSearchLanguage] = useState('');
  console.log();

  useEffect(() => {
    // 인기 스니펫 로딩
    fetch('/api/snippets?page=0&size=6&sort=likeCount,desc')
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data) => {
        if (data.content && data.content.length > 0) {
          setPopularSnippets(data.content);
        } else {
          setPopularSnippets(dummySnippets); // 데이터 없으면 더미 데이터 사용
        }
      })
      .catch((err) => {
        console.error('🔥 인기 스니펫 로딩 실패:', err);
        setPopularSnippets(dummySnippets); // 에러 발생 시 더미 데이터 사용
      });

    // 최신 게시글 로딩
    const postParams = new URLSearchParams({
      page: 0,
      size: 5,
      sort: 'createdAt,desc',
    });

    fetch(`/api/posts?${postParams.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data) => {
        if (data.content && data.content.length > 0) {
          setRecentPosts(data.content);
        } else {
          setRecentPosts(dummyPosts); // 데이터 없으면 더미 데이터 사용
        }
      })
      .catch((err) => {
        console.error('🔥 최신 게시글 로딩 실패:', err);
        setRecentPosts(dummyPosts); // 에러 발생 시 더미 데이터 사용
      });
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/snippets?search=${searchTerm}&language=${searchLanguage}`);
  };

  const getLanguageBadgeClass = (language) => {
    const lang = language?.toLowerCase() || 'default';
    return `language-badge badge-${lang}`;
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section text-start">
  <div className="container hero-container">
    {/* 왼쪽 텍스트 영역 */}
    <div className="hero-text">
      <h1 className="display-4">코드를 공유하고, 함께 성장하세요</h1>
      <p className="lead">
        SNI는 개발자들을 위한 코드 공유 플랫폼입니다.<br />
        자유롭게 코드를 올리고, 피드백을 받으며 실력을 향상시켜 보세요.
      </p>
      <div className="d-flex gap-3 mt-3">
        <Link to="/snippets" className="btn btn-primary btn-lg">스니펫 둘러보기</Link>
        {!isLoggedIn && (
          <Link to="/register" className="btn btn-outline-secondary btn-lg">무료 회원가입</Link>
        )}
      </div>
    </div>

    {/* 오른쪽 로고 영역 */}
    <div className="hero-visual">
      <div className="code-logo">
        <span>&lt;/&gt;</span>
      </div>
    </div>
  </div>
</section>


      {/* Search Section */}
      <section className="py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-10 col-lg-8">
              <div className="card search-card">
                <div className="card-body p-4">
                  <h5 className="card-title text-center mb-4">스니펫 검색</h5>
                  <form onSubmit={handleSearch}>
                    <div className="input-group input-group-lg">
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="키워드, 언어, 작성자 등..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <select 
                        className="form-select" 
                        style={{ maxWidth: 180 }}
                        value={searchLanguage}
                        onChange={(e) => setSearchLanguage(e.target.value)}
                      >
                        <option value="">모든 언어</option>
                        <option value="HTML">HTML</option>
                        <option value="CSS">CSS</option>
                        <option value="JAVASCRIPT">JavaScript</option>
                        <option value="JAVA">Java</option>
                        <option value="PYTHON">Python</option>
                        <option value="C">C</option>
                      </select>
                      <button className="btn btn-primary" type="submit">
                        <i className="bi bi-search"></i>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Snippets */}
      <section className="py-5 bg-light">
        <div className="container">
          <h2 className="text-center mb-5">인기 스니펫</h2>
          <div className="row">
            {popularSnippets.length > 0 ? (
              popularSnippets.map(snippet => (
                <div className="col-md-6 col-lg-4 mb-4" key={snippet.snippetId}>
                  <div className="card h-100 snippet-card">
                    <div className="card-body d-flex flex-column">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <span className={getLanguageBadgeClass(snippet.language)}>{snippet.language}</span>
                        <small className="text-muted">{new Date(snippet.createdAt).toLocaleDateString()}</small>
                      </div>
                      <h5 className="card-title mt-2">{snippet.title}</h5>
                      <p className="card-text text-muted flex-grow-1">{snippet.description?.slice(0, 100)}</p>
                      <div className="d-flex justify-content-between align-items-center mt-auto">
                        <small className="text-muted">by {snippet.author?.nickname}</small>
                        <div className="d-flex align-items-center gap-2 text-danger">
                          <i className="bi bi-heart-fill"></i>
                          <small>{snippet.likeCount}</small>
                        </div>
                      </div>
                    </div>
                    <div className="card-footer bg-transparent border-top-0">
                      <Link to={`/snippets/${snippet.snippetId}`} className="btn btn-outline-primary btn-sm w-100">자세히 보기</Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-12 text-center py-5">
                <i className="bi bi-code-slash display-1 text-muted mb-3"></i>
                <h4 className="text-muted">아직 스니펫이 없어요.</h4>
                <p className="mb-4">가장 먼저 스니펫을 공유해보세요!</p>
                <Link to="/snippets/write" className="btn btn-primary">스니펫 작성하기</Link>
              </div>
            )}
          </div>
          {popularSnippets.length > 0 && (
            <div className="text-center mt-4">
              <Link to="/snippets" className="btn btn-primary">더 많은 스니펫 보기</Link>
            </div>
          )}
        </div>
      </section>

      {/* Recent Posts */}
      <section className="py-5">
        <div className="container">
          <h2 className="text-center mb-5">최신 게시글</h2>
          <div className="col-lg-10 mx-auto">
            {recentPosts.length > 0 ? (
              <div className="list-group shadow-sm">
                {recentPosts.map(post => (
                  <Link to={`/board/${post.postId}`} className="list-group-item list-group-item-action" key={post.postId}>
                    <div className="d-flex w-100 justify-content-between">
                      <h5 className="mb-1">{post.title}</h5>
                      <small className="text-muted">{new Date(post.createdAt).toLocaleDateString()}</small>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mt-2">
                      <small className="text-muted">by {post.author?.nickname}</small>
                      <div className="d-flex align-items-center gap-3 text-muted">
                        <small><i className="bi bi-eye-fill me-1"></i>{post.viewCount ?? 0}</small>
                        <small><i className="bi bi-heart-fill me-1"></i>{post.likeCount ?? 0}</small>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-5">
                <i className="bi bi-chat-dots display-1 text-muted mb-3"></i>
                <h4 className="text-muted">아직 게시글이 없어요.</h4>
                <p className="mb-4">자유롭게 이야기를 나눠보세요!</p>
                <Link to="/board/write" className="btn btn-primary">게시글 작성하기</Link>
              </div>
            )}
            {recentPosts.length > 0 && (
              <div className="text-center mt-4">
                <Link to="/board" className="btn btn-outline-primary">게시판으로 이동</Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta-section text-center">
        <div className="container">
          <h2 className="display-5 mb-3">지금 바로 시작하세요!</h2>
          <p className="lead mb-4">SNI에 가입하여 당신의 코드를 공유하고, 다른 개발자들과 함께 성장하세요.</p>
          {!isLoggedIn && (
            <Link to="/register" className="btn btn-light btn-lg">무료 회원가입</Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
