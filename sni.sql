DROP DATABASE IF EXISTS snippethub_db;
CREATE DATABASE snippethub_db;
use snippethub_db;



CREATE TABLE users (
    user_id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password        VARCHAR(255) NOT NULL, -- 실제로는 해시된 값 저장
    nickname        VARCHAR(50) NOT NULL UNIQUE,
    grade           VARCHAR(20) DEFAULT 'Bronze',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 코드 스니펫 테이블
CREATE TABLE snippets (
    snippet_id      BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    language        VARCHAR(50),
    code            TEXT NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 게시글 테이블
CREATE TABLE posts (
    post_id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    title           VARCHAR(255) NOT NULL,
    content         TEXT NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 좋아요 테이블 (스니펫/게시글 공용)
CREATE TABLE likes (
    like_id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    post_id         BIGINT,
    snippet_id      BIGINT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
    FOREIGN KEY (snippet_id) REFERENCES snippets(snippet_id) ON DELETE CASCADE,
    UNIQUE (user_id, post_id),       -- 한 사용자는 하나의 게시글에 한 번만 좋아요 가능
    UNIQUE (user_id, snippet_id)     -- 한 사용자는 하나의 스니펫에 한 번만 좋아요 가능
);

-- 댓글 테이블 (스니펫/게시글 공용)
CREATE TABLE comments (
    comment_id      BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    post_id         BIGINT,
    snippet_id      BIGINT,
    content         TEXT NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
    FOREIGN KEY (snippet_id) REFERENCES snippets(snippet_id) ON DELETE CASCADE
);

-- 지원 언어 테이블
CREATE TABLE languages (
    language_id     INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(50) NOT NULL, -- 예: "JavaScript"
    value           VARCHAR(50) NOT NULL  -- 예: "javascript"
);

-- 기본 언어 데이터 삽입
INSERT INTO languages (name, value) VALUES
('JavaScript', 'javascript'),
('Python', 'python'),
('Java', 'java'),
('C++', 'cpp'),
('HTML', 'html'),
('CSS', 'css');
