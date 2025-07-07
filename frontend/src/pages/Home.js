import React from 'react';
import { Link } from 'react-router-dom';
import '../css/Home.css';
// 필요시 import { useState, useEffect } from 'react';
// import axios from 'axios';

const Home = ({ popularSnippets = [], recentPosts = [] }) => {
  // 언어별 배지 클래스 반환 함수
  const getLanguageBadgeClass = (language) => {
    const languageLower = language?.toLowerCase();
    switch (languageLower) {
      case 'html': return 'language-badge badge-html';
      case 'css': return 'language-badge badge-css';
      case 'javascript': return 'language-badge badge-javascript';
      case 'java': return 'language-badge badge-java';
      case 'python': return 'language-badge badge-python';
      case 'c': return 'language-badge badge-c';
      default: return 'language-badge badge-default';
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h1 className="display-4 fw-bold mb-4">코드를 공유하고, 실행하고, 성장하세요</h1>
              <p className="lead mb-4">SNI에서 다양한 프로그래밍 언어의 코드를 공유하고, 실시간으로 실행해보세요.</p>
              <div className="d-flex gap-3">
                <Link to="/snippets" className="btn btn-light btn-lg">스니펫 둘러보기</Link>
                <Link to="/register" className="btn btn-outline-light btn-lg">회원가입</Link>
              </div>
            </div>
            <div className="col-lg-6 text-center">
              <i className="bi bi-code-square display-1"></i>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-8">
              <div className="card search-card">
                <div className="card-body">
                  <h5 className="card-title text-center mb-4">스니펫 검색</h5>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    // 검색 로직 구현
                    console.log('검색 실행');
                  }}>
                    <div className="input-group">
                      <input type="text" className="form-control" name="search" placeholder="검색어를 입력하세요..." />
                      <select className="form-select" name="language" style={{ maxWidth: 150 }}>
                        <option value="">모든 언어</option>
                        <option value="HTML">HTML</option>
                        <option value="CSS">CSS</option>
                        <option value="JAVASCRIPT">JavaScript</option>
                        <option value="JAVA">Java</option>
                        <option value="PYTHON">Python</option>
                        <option value="C">C</option>
                      </select>
                      <button className="btn btn-primary" type="submit">
                        <i className="bi bi-search"></i> 검색
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
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <span className={getLanguageBadgeClass(snippet.language)}>
                          {snippet.language}
                        </span>
                        <small className="text-muted">{snippet.createdAt?.slice(0, 10)}</small>
                      </div>
                      <h5 className="card-title">{snippet.title}</h5>
                      <p className="card-text text-muted">{snippet.description?.slice(0, 100)}</p>
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">{snippet.author?.nickname}</small>
                        <div className="d-flex align-items-center gap-2">
                          <i className="bi bi-heart-fill text-danger like-button"></i>
                          <small>{snippet.likeCount}</small>
                        </div>
                      </div>
                    </div>
                    <div className="card-footer bg-transparent">
                      <Link to={`/snippets/${snippet.snippetId}`} className="btn btn-outline-primary btn-sm w-100">자세히 보기</Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-12 text-center">
                <div className="py-5">
                  <i className="bi bi-code-square display-1 text-muted mb-3"></i>
                  <h4 className="text-muted">아직 등록된 스니펫이 없습니다</h4>
                  <p className="text-muted mb-4">첫 번째 스니펫을 등록해보세요!</p>
                  <Link to="/snippets/create" className="btn btn-primary">스니펫 작성하기</Link>
                </div>
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
          <h2 className="text-center mb-5">최신 자유게시판 글</h2>
          <div className="row">
            <div className="col-lg-8 mx-auto">
              {recentPosts.length > 0 ? (
                <div className="list-group">
                  {recentPosts.map(post => (
                    <div className="list-group-item list-group-item-action" key={post.postId}>
                      <div className="d-flex w-100 justify-content-between">
                        <h5 className="mb-1">
                          <Link to={`/board/${post.postId}`} className="text-decoration-none">{post.title}</Link>
                        </h5>
                        <small className="text-muted">{post.createdAt?.slice(0, 10)}</small>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">{post.author?.nickname}</small>
                        <div className="d-flex align-items-center gap-3">
                          <small className="text-muted">
                            <i className="bi bi-eye"></i> <span>{post.viewCount ?? 0}</span>
                          </small>
                          <small className="text-muted">
                            <i className="bi bi-heart"></i> <span>{post.likeCount ?? 0}</span>
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5">
                  <i className="bi bi-chat-square-text display-1 text-muted mb-3"></i>
                  <h4 className="text-muted">아직 작성된 게시글이 없습니다</h4>
                  <p className="text-muted mb-4">첫 번째 게시글을 작성해보세요!</p>
                  <Link to="/board/create" className="btn btn-primary">게시글 작성하기</Link>
                </div>
              )}
              {recentPosts.length > 0 && (
                <div className="text-center mt-4">
                  <Link to="/board" className="btn btn-outline-primary">게시판으로 이동</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="hero-section">
        <div className="container text-center">
          <h2 className="mb-4">지금 시작하세요!</h2>
          <p className="lead mb-4">SNI에 가입하고 다양한 개발자들과 코드를 공유해보세요.</p>
          <Link to="/register" className="btn btn-light btn-lg">무료 회원가입</Link>
        </div>
      </section>
    </div>
  );
};

export default Home;