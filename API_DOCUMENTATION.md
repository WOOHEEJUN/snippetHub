# 프로젝트 API 문서

## 1. 기본 원칙

- **Base URL**: `/api/v1`
- **인증**: 인증이 필요한 모든 API는 요청 헤더에 `Authorization: Bearer <JWT_TOKEN>`을 포함해야 합니다.
- **성공 응답**:
    - `200 OK`: 요청 성공 (주로 GET)
    - `201 Created`: 리소스 생성 성공 (POST)
    - `204 No Content`: 응답 본문이 없음 (DELETE, 일부 PUT/PATCH)
- **에러 응답**:
    - `400 Bad Request`: 잘못된 요청 (파라미터 오류 등)
    - `401 Unauthorized`: 인증되지 않은 사용자
    - `403 Forbidden`: 권한 없는 사용자
    - `404 Not Found`: 리소스를 찾을 수 없음
    - `500 Internal Server Error`: 서버 내부 오류
- **페이지네이션**: 목록 조회 API는 페이지네이션을 지원합니다. (`?page=0&size=10`)

---

## 2. 인증 (Authentication)

### 2.1. 회원가입

- **Description**: 새로운 사용자를 등록합니다.
- **Endpoint**: `POST /api/v1/auth/register`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "nickname": "새로운사용자"
  }
  ```
- **Response**:
  - **201 Created**:
    ```json
    {
      "userId": 1,
      "email": "user@example.com",
      "nickname": "새로운사용자"
    }
    ```

### 2.2. 로그인

- **Description**: 이메일과 비밀번호로 로그인하고 JWT 토큰을 발급받습니다.
- **Endpoint**: `POST /api/v1/auth/login`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response**:
  - **200 OK**:
    ```json
    {
      "accessToken": "ey...",
      "tokenType": "Bearer"
    }
    ```

### 2.3. 로그아웃

- **Description**: 사용자를 로그아웃 처리합니다. (서버 측에서 토큰 무효화)
- **Endpoint**: `POST /api/v1/auth/logout`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Response**:
  - **204 No Content**

---

## 3. 사용자 (Users)

### 3.1. 내 프로필 정보 조회

- **Description**: 현재 로그인된 사용자의 프로필 정보를 조회합니다.
- **Endpoint**: `GET /api/v1/users/me`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Response**:
  - **200 OK**:
    ```json
    {
      "userId": 1,
      "email": "user@example.com",
      "nickname": "현재사용자"
    }
    ```

### 3.2. 닉네임 변경

- **Description**: 현재 로그인된 사용자의 닉네임을 변경합니다.
- **Endpoint**: `PATCH /api/v1/users/me/nickname`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Request Body**:
  ```json
  {
    "nickname": "새로운닉네임"
  }
  ```
- **Response**:
  - **200 OK**:
    ```json
    {
      "userId": 1,
      "email": "user@example.com",
      "nickname": "새로운닉네임"
    }
    ```

### 3.3. 비밀번호 변경

- **Description**: 현재 로그인된 사용자의 비밀번호를 변경합니다.
- **Endpoint**: `PATCH /api/v1/users/me/password`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Request Body**:
  ```json
  {
    "currentPassword": "current_password",
    "newPassword": "new_password"
  }
  ```
- **Response**:
  - **204 No Content**

### 3.4. 회원 탈퇴

- **Description**: 현재 로그인된 사용자의 계정을 삭제합니다.
- **Endpoint**: `DELETE /api/v1/users/me`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Response**:
  - **204 No Content**

### 3.5. 내 활동 내역 및 등급 조회

- **Description**: 나의 활동 지표(게시글 수, 댓글 수, 받은 좋아요 수)와 등급을 조회합니다.
- **Endpoint**: `GET /api/v1/users/me/activity`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Response**:
  - **200 OK**:
    ```json
    {
      "postCount": 50,
      "commentCount": 120,
      "likesReceived": 250,
      "grade": "Gold"
    }
    ```

---

## 4. 코드 스니펫 (Snippets)

### 4.1. 내가 공유한 스니펫 목록 조회

- **Description**: 내가 작성한 코드 스니펫 목록을 조회합니다.
- **Endpoint**: `GET /api/v1/users/me/snippets`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Query Parameters**: `?page=0&size=10`
- **Response**:
  - **200 OK**:
    ```json
    {
      "content": [
        {
          "snippetId": 1,
          "title": "React Hook 사용 예제",
          "language": "javascript",
          "likeCount": 15,
          "createdAt": "2025-07-07T10:00:00Z"
        }
      ],
      "pageable": { ... },
      "totalPages": 1,
      "totalElements": 1
    }
    ```

### 4.2. (전체) 스니펫 목록 조회

- **Description**: 모든 사용자가 작성한 스니펫 목록을 조회합니다. (검색, 필터링 기능 포함 가능)
- **Endpoint**: `GET /api/v1/snippets`
- **Query Parameters**: `?page=0&size=10&language=java&query=keyword`
- **Response**:
  - **200 OK**: (4.1. 응답 형식과 동일)

### 4.3. 스니펫 상세 조회

- **Description**: 특정 코드 스니펫의 상세 내용을 조회합니다.
- **Endpoint**: `GET /api/v1/snippets/{snippetId}`
- **Response**:
  - **200 OK**:
    ```json
    {
      "snippetId": 1,
      "author": {
        "userId": 1,
        "nickname": "작성자"
      },
      "title": "React Hook 사용 예제",
      "description": "useState와 useEffect를 사용한 간단한 카운터 예제입니다.",
      "language": "javascript",
      "code": "const Counter = () => { ... };",
      "likeCount": 15,
      "createdAt": "2025-07-07T10:00:00Z",
      "updatedAt": "2025-07-07T10:05:00Z"
    }
    ```

### 4.4. 스니펫 작성

- **Description**: 새로운 코드 스니펫을 작성합니다.
- **Endpoint**: `POST /api/v1/snippets`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Request Body**:
  ```json
  {
    "title": "새 스니펫",
    "description": "스니펫에 대한 설명",
    "language": "python",
    "code": "print('Hello, World!')"
  }
  ```
- **Response**:
  - **201 Created**: (Location 헤더에 생성된 리소스 URI 포함)
    ```json
    {
      "snippetId": 2
    }
    ```

### 4.5. 스니펫 수정

- **Description**: 내가 작성한 코드 스니펫을 수정합니다.
- **Endpoint**: `PUT /api/v1/snippets/{snippetId}`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Request Body**: (4.4. Request Body와 동일)
- **Response**:
  - **200 OK**: (4.3. 응답 형식과 동일)

### 4.6. 스니펫 삭제

- **Description**: 내가 작성한 코드 스니펫을 삭제합니다.
- **Endpoint**: `DELETE /api/v1/snippets/{snippetId}`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Response**:
  - **204 No Content**

---

## 5. 게시글 (Posts)

> 스니펫 API와 구조가 거의 동일합니다. (`snippetId` -> `postId`)

### 5.1. 내가 쓴 게시글 목록 조회

- **Description**: 내가 작성한 게시글 목록을 조회합니다.
- **Endpoint**: `GET /api/v1/users/me/posts`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Query Parameters**: `?page=0&size=10`
- **Response**:
  - **200 OK**: (스니펫 목록과 유사한 형태)

### 5.2. (전체) 게시글 목록 조회

- **Endpoint**: `GET /api/v1/posts`

### 5.3. 게시글 상세 조회

- **Endpoint**: `GET /api/v1/posts/{postId}`

### 5.4. 게시글 작성

- **Endpoint**: `POST /api/v1/posts`
- **Request Body**:
  ```json
  {
    "title": "게시글 제목",
    "content": "게시글 내용"
  }
  ```

### 5.5. 게시글 수정

- **Endpoint**: `PUT /api/v1/posts/{postId}`

### 5.6. 게시글 삭제

- **Endpoint**: `DELETE /api/v1/posts/{postId}`

---

## 6. 기타 (Miscellaneous)

### 6.1. 지원 언어 목록 조회

- **Description**: 스니펫 작성 시 선택 가능한 프로그래밍 언어 목록을 조회합니다. (언어 선택 Dropdown용)
- **Endpoint**: `GET /api/v1/languages`
- **Response**:
  - **200 OK**:
    ```json
    [
      { "name": "JavaScript", "value": "javascript" },
      { "name": "Python", "value": "python" },
      { "name": "Java", "value": "java" },
      { "name": "C++", "value": "cpp" }
    ]
    ```
