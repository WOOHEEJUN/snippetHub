# 데이터베이스 쿼리 문서 (SQL)

이 문서는 API 명세에 기반한 데이터베이스 테이블 구조(DDL)와 각 API 호출에 필요한 SQL 쿼리(DML) 예시를 정의합니다.

**참고**:
- 실제 프로덕션 환경에서는 비밀번호를 해시하여 저장해야 합니다.
- `:variable` 구문은 애플리케이션에서 동적으로 채워져야 할 파라미터를 의미합니다. (예: PreparedStatement)
- 성능 향상을 위해 적절한 인덱스(index)를 추가해야 합니다. (예: FK, 자주 조회되는 컬럼)

---

## 1. DDL (Data Definition Language) - 테이블 생성

```sql
-- 사용자 정보 테이블
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
    UNIQUE (user_id, snippet_id)   -- 한 사용자는 하나의 스니펫에 한 번만 좋아요 가능
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
    name            VARCHAR(50) NOT NULL, -- "JavaScript"
    value           VARCHAR(50) NOT NULL  -- "javascript"
);

-- 기본 언어 데이터 삽입
INSERT INTO languages (name, value) VALUES
('JavaScript', 'javascript'),
('Python', 'python'),
('Java', 'java'),
('C++', 'cpp'),
('HTML', 'html'),
('CSS', 'css');

```

---

## 2. DML (Data Manipulation Language) - API별 쿼리

### 2.1. 인증 (Authentication)

-- **회원가입 (POST /api/v1/auth/register)**
INSERT INTO users (email, password, nickname)
VALUES (:email, :hashed_password, :nickname);

-- **로그인 (POST /api/v1/auth/login)**
SELECT user_id, email, password FROM users WHERE email = :email;


### 2.2. 사용자 (Users)

-- **내 프로필 정보 조회 (GET /api/v1/users/me)**
SELECT user_id, email, nickname FROM users WHERE user_id = :user_id;

-- **닉네임 변경 (PATCH /api/v1/users/me/nickname)**
UPDATE users SET nickname = :new_nickname WHERE user_id = :user_id;

-- **비밀번호 변경 (PATCH /api/v1/users/me/password)**
-- 1. 현재 비밀번호 확인
SELECT password FROM users WHERE user_id = :user_id;
-- 2. (애플리케이션에서 비밀번호 일치 확인 후) 비밀번호 업데이트
UPDATE users SET password = :new_hashed_password WHERE user_id = :user_id;

-- **회원 탈퇴 (DELETE /api/v1/users/me)**
DELETE FROM users WHERE user_id = :user_id;

-- **내 활동 내역 및 등급 조회 (GET /api/v1/users/me/activity)**
-- (이 쿼리는 여러 개의 쿼리를 실행하거나, JOIN을 사용하여 한 번에 가져올 수 있습니다.)
SELECT
    u.grade,
    (SELECT COUNT(*) FROM posts p WHERE p.user_id = u.user_id) AS post_count,
    (SELECT COUNT(*) FROM comments c WHERE c.user_id = u.user_id) AS comment_count,
    (SELECT COUNT(*) FROM likes l JOIN posts p ON l.post_id = p.post_id WHERE p.user_id = u.user_id) +
    (SELECT COUNT(*) FROM likes l JOIN snippets s ON l.snippet_id = s.snippet_id WHERE s.user_id = u.user_id) AS likes_received
FROM users u
WHERE u.user_id = :user_id;


### 2.3. 코드 스니펫 (Snippets)

-- **내가 공유한 스니펫 목록 조회 (GET /api/v1/users/me/snippets)**
SELECT
    s.snippet_id,
    s.title,
    s.language,
    (SELECT COUNT(*) FROM likes l WHERE l.snippet_id = s.snippet_id) as like_count,
    s.created_at
FROM snippets s
WHERE s.user_id = :user_id
ORDER BY s.created_at DESC
LIMIT :limit OFFSET :offset;

-- **(전체) 스니펫 목록 조회 (GET /api/v1/snippets)**
SELECT
    s.snippet_id,
    s.title,
    s.language,
    (SELECT COUNT(*) FROM likes l WHERE l.snippet_id = s.snippet_id) as like_count,
    s.created_at
FROM snippets s
WHERE (:language IS NULL OR s.language = :language)
  AND (:query IS NULL OR s.title LIKE :query OR s.description LIKE :query)
ORDER BY s.created_at DESC
LIMIT :limit OFFSET :offset;

-- **스니펫 상세 조회 (GET /api/v1/snippets/{snippetId})**
SELECT
    s.snippet_id,
    s.title,
    s.description,
    s.language,
    s.code,
    s.created_at,
    s.updated_at,
    u.user_id as author_id,
    u.nickname as author_nickname,
    (SELECT COUNT(*) FROM likes l WHERE l.snippet_id = s.snippet_id) as like_count
FROM snippets s
JOIN users u ON s.user_id = u.user_id
WHERE s.snippet_id = :snippet_id;

-- **스니펫 작성 (POST /api/v1/snippets)**
INSERT INTO snippets (user_id, title, description, language, code)
VALUES (:user_id, :title, :description, :language, :code);

-- **스니펫 수정 (PUT /api/v1/snippets/{snippetId})**
UPDATE snippets
SET title = :title, description = :description, language = :language, code = :code
WHERE snippet_id = :snippet_id AND user_id = :user_id;

-- **스니펫 삭제 (DELETE /api/v1/snippets/{snippetId})**
DELETE FROM snippets WHERE snippet_id = :snippet_id AND user_id = :user_id;


### 2.4. 게시글 (Posts) - 스니펫과 유사

-- **내가 쓴 게시글 목록 조회 (GET /api/v1/users/me/posts)**
SELECT
    p.post_id,
    p.title,
    (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.post_id) as like_count,
    p.created_at
FROM posts p
WHERE p.user_id = :user_id
ORDER BY p.created_at DESC
LIMIT :limit OFFSET :offset;

-- **게시글 작성 (POST /api/v1/posts)**
INSERT INTO posts (user_id, title, content)
VALUES (:user_id, :title, :content);

-- **게시글 수정 (PUT /api/v1/posts/{postId})**
UPDATE posts SET title = :title, content = :content
WHERE post_id = :post_id AND user_id = :user_id;

-- **게시글 삭제 (DELETE /api/v1/posts/{postId})**
DELETE FROM posts WHERE post_id = :post_id AND user_id = :user_id;


### 2.5. 기타 (Miscellaneous)

-- **지원 언어 목록 조회 (GET /api/v1/languages)**
SELECT name, value FROM languages ORDER BY name ASC;

