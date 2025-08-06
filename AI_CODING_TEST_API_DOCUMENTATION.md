# 📚 **AI 코드 테스트 시스템 API 문서**

## 🔐 **인증**
모든 API는 JWT 토큰 인증이 필요합니다.
```http
Authorization: Bearer {your_jwt_token}
```

---

## 🤖 **AI 관련 API**

### **1. AI 문제 생성**
```http
POST /api/ai/problems/generate
```
**설명**: AI가 새로운 코딩 문제를 생성합니다.

**Query Parameters:**
- `difficulty` (필수): `EASY` | `MEDIUM` | `HARD` | `EXPERT`
- `category` (필수): `ALGORITHM` | `DATA_STRUCTURE` | `WEB_DEVELOPMENT` | `DATABASE` | `SYSTEM_DESIGN` | `FRONTEND` | `BACKEND` | `DEVOPS`

**사용 예시:**
```http
POST /api/ai/problems/generate?difficulty=EASY&category=ALGORITHM
Authorization: Bearer {your_jwt_token}
```

**응답 예시:**
```json
{
  "success": true,
  "message": "AI가 새로운 문제를 생성했습니다.",
  "data": {
    "problemId": 1,
    "title": "배열에서 최대값 찾기",
    "description": "주어진 배열에서 최대값을 찾는 함수를 작성하세요.",
    "difficulty": "EASY",
    "category": "ALGORITHM",
    "problemStatement": "...",
    "inputFormat": "...",
    "outputFormat": "...",
    "constraints": "...",
    "sampleInput": "1 2 3 4 5",
    "sampleOutput": "5",
    "solutionTemplate": "...",
    "timeLimit": 1000,
    "memoryLimit": 128
  }
}
```

### **2. 일일 AI 문제 생성**
```http
POST /api/ai/problems/generate-daily
```
**설명**: 오늘의 일일 과제용 AI 문제를 생성합니다.

**응답 예시:**
```json
{
  "success": true,
  "message": "오늘의 AI 문제가 생성되었습니다.",
  "data": {
    "problemId": 2,
    "title": "문자열 뒤집기",
    "difficulty": "EASY",
    "category": "ALGORITHM"
  }
}
```

### **3. 개인화된 AI 문제 생성**
```http
POST /api/ai/problems/generate-personalized
```
**설명**: 사용자 수준에 맞는 개인화된 문제를 생성합니다.

**Query Parameters:**
- `userLevel` (선택): `int` (기본값: 3)

### **4. 코드 품질 평가**
```http
POST /api/ai/evaluate/code-quality
```
**설명**: AI가 코드의 품질을 평가합니다.

**Query Parameters:**
- `code` (필수): 평가할 코드
- `language` (필수): 프로그래밍 언어
- `problemId` (필수): 문제 ID

**응답 예시:**
```json
{
  "success": true,
  "message": "코드 품질 평가가 완료되었습니다.",
  "data": {
    "score": 85.5,
    "feedback": "코드가 잘 작성되었습니다. 가독성을 더 높일 수 있습니다.",
    "suggestions": ["변수명을 더 명확하게 작성하세요", "주석을 추가하세요"]
  }
}
```

### **5. 코드 최적화 제안**
```http
POST /api/ai/suggest/optimization
```
**설명**: AI가 코드 최적화 방안을 제안합니다.

**Query Parameters:**
- `code` (필수): 최적화할 코드
- `language` (필수): 프로그래밍 언어
- `problemId` (필수): 문제 ID

### **6. 코드 설명 생성**
```http
POST /api/ai/explain/code
```
**설명**: AI가 코드에 대한 설명을 생성합니다.

**Query Parameters:**
- `code` (필수): 설명할 코드
- `language` (필수): 프로그래밍 언어

### **7. 학습 경로 제안**
```http
POST /api/ai/suggest/learning-path
```
**설명**: 사용자에게 맞는 학습 경로를 제안합니다.

---

## 📝 **문제 관리 API**

### **8. 문제 목록 조회**
```http
GET /api/problems
```
**설명**: 활성화된 문제 목록을 페이징하여 조회합니다.

**Query Parameters:**
- `page` (선택): 페이지 번호 (기본값: 0)
- `size` (선택): 페이지 크기 (기본값: 20)

**응답 예시:**
```json
{
  "success": true,
  "message": "문제 목록을 조회했습니다.",
  "data": {
    "content": [
      {
        "problemId": 1,
        "title": "배열에서 최대값 찾기",
        "difficulty": "EASY",
        "category": "ALGORITHM",
        "totalSubmissions": 150,
        "correctSubmissions": 120,
        "successRate": 80.0
      }
    ],
    "totalElements": 100,
    "totalPages": 5,
    "currentPage": 0,
    "size": 20
  }
}
```

### **9. 문제 상세 조회**
```http
GET /api/problems/{problemId}
```
**설명**: 특정 문제의 상세 정보를 조회합니다.

### **10. 난이도별 문제 조회**
```http
GET /api/problems/difficulty/{difficulty}
```
**설명**: 특정 난이도의 문제들만 조회합니다.

**Path Parameters:**
- `difficulty`: `EASY` | `MEDIUM` | `HARD` | `EXPERT`

### **11. 카테고리별 문제 조회**
```http
GET /api/problems/category/{category}
```
**설명**: 특정 카테고리의 문제들만 조회합니다.

**Path Parameters:**
- `category`: `ALGORITHM` | `DATA_STRUCTURE` | `WEB_DEVELOPMENT` | `DATABASE` | `SYSTEM_DESIGN` | `FRONTEND` | `BACKEND` | `DEVOPS`

### **12. 난이도+카테고리별 문제 조회**
```http
GET /api/problems/difficulty/{difficulty}/category/{category}
```
**설명**: 특정 난이도와 카테고리의 문제들만 조회합니다.

### **13. 문제 검색**
```http
GET /api/problems/search?title={title}
```
**설명**: 제목으로 문제를 검색합니다.

**Query Parameters:**
- `title` (필수): 검색할 제목 키워드

### **14. 랜덤 문제 조회**
```http
GET /api/problems/random
```
**설명**: 랜덤한 문제 하나를 조회합니다.

### **15. 난이도별 랜덤 문제 조회**
```http
GET /api/problems/random/difficulty/{difficulty}
```
**설명**: 특정 난이도의 랜덤 문제를 조회합니다.

### **16. 문제 통계 조회**
```http
GET /api/problems/statistics
```
**설명**: 전체 문제 통계를 조회합니다.

**응답 예시:**
```json
{
  "success": true,
  "message": "문제 통계를 조회했습니다.",
  "data": {
    "totalProblems": 100,
    "activeProblems": 95,
    "totalSubmissions": 1500,
    "correctSubmissions": 1200,
    "overallSuccessRate": 80.0
  }
}
```

### **17. 난이도 목록 조회**
```http
GET /api/problems/difficulties
```
**설명**: 사용 가능한 난이도 목록을 조회합니다.

### **18. 카테고리 목록 조회**
```http
GET /api/problems/categories
```
**설명**: 사용 가능한 카테고리 목록을 조회합니다.

---

## 💻 **코드 제출 API**

### **19. 코드 제출**
```http
POST /api/submissions/problems/{problemId}
```
**설명**: 문제에 대한 코드를 제출하고 실행 결과를 받습니다.

**Path Parameters:**
- `problemId` (필수): 문제 ID

**Request Body:**
```json
{
  "code": "def find_max(arr):\n    return max(arr)",
  "language": "python"
}
```

**응답 예시:**
```json
{
  "success": true,
  "message": "코드가 제출되었습니다.",
  "data": {
    "submissionId": 1,
    "problemId": 1,
    "problemTitle": "배열에서 최대값 찾기",
    "submittedCode": "def find_max(arr):\n    return max(arr)",
    "language": "python",
    "status": "ACCEPTED",
    "executionTime": 15,
    "memoryUsed": 1024,
    "testCasesPassed": 5,
    "totalTestCases": 5,
    "errorMessage": null,
    "output": "5",
    "submittedAt": "2024-01-15T10:30:00",
    "isCorrect": true
  }
}
```

### **20. 내 제출 이력 조회**
```http
GET /api/submissions/my
```
**설명**: 현재 사용자의 모든 제출 이력을 조회합니다.

**Query Parameters:**
- `page` (선택): 페이지 번호
- `size` (선택): 페이지 크기

### **21. 특정 문제의 제출 이력 조회**
```http
GET /api/submissions/my/problems/{problemId}
```
**설명**: 특정 문제에 대한 사용자의 제출 이력을 조회합니다.

### **22. 내 정답 제출만 조회**
```http
GET /api/submissions/my/correct
```
**설명**: 사용자의 정답 제출만 조회합니다.

### **23. 문제 해결 여부 확인**
```http
GET /api/submissions/check/{problemId}
```
**설명**: 사용자가 특정 문제를 해결했는지 확인합니다.

**응답 예시:**
```json
{
  "success": true,
  "message": "문제 해결 여부를 확인했습니다.",
  "data": true
}
```

### **24. 최근 제출 조회**
```http
GET /api/submissions/my/problems/{problemId}/latest
```
**설명**: 특정 문제에 대한 사용자의 최근 제출을 조회합니다.

### **25. 오늘 제출 수 조회**
```http
GET /api/submissions/my/today-count
```
**설명**: 사용자의 오늘 제출 횟수를 조회합니다.

### **26. 제출 상태 목록 조회**
```http
GET /api/submissions/statuses
```
**설명**: 사용 가능한 제출 상태 목록을 조회합니다.

**응답 예시:**
```json
{
  "success": true,
  "message": "제출 상태 목록을 조회했습니다.",
  "data": [
    {
      "name": "PENDING",
      "displayName": "대기중",
      "color": "#FF9800"
    },
    {
      "name": "ACCEPTED",
      "displayName": "정답",
      "color": "#4CAF50"
    },
    {
      "name": "WRONG_ANSWER",
      "displayName": "오답",
      "color": "#F44336"
    }
  ]
}
```

---

## 🗓️ **일일 문제 API**

### **27. 오늘의 일일 문제 조회**
```http
GET /api/daily-problems/today
```
**설명**: 오늘의 일일 문제를 조회합니다.

### **28. 특정 날짜의 일일 문제 조회**
```http
GET /api/daily-problems/date/{date}
```
**설명**: 특정 날짜의 일일 문제를 조회합니다.

**Path Parameters:**
- `date`: 날짜 (YYYY-MM-DD 형식)

### **29. 이번 주 일일 문제들 조회**
```http
GET /api/daily-problems/this-week
```
**설명**: 이번 주의 모든 일일 문제를 조회합니다.

### **30. 이번 달 일일 문제들 조회**
```http
GET /api/daily-problems/this-month
```
**설명**: 이번 달의 모든 일일 문제를 조회합니다.

### **31. 일일 문제 통계 조회**
```http
GET /api/daily-problems/statistics
```
**설명**: 일일 문제 관련 통계를 조회합니다.

### **32. 일일 문제 생성 (관리자용)**
```http
POST /api/daily-problems
```
**설명**: 특정 날짜에 일일 문제를 생성합니다.

**Query Parameters:**
- `problemDate` (필수): 문제 날짜 (YYYY-MM-DD)
- `problemId` (필수): 문제 ID

### **33. 랜덤 일일 문제 생성 (관리자용)**
```http
POST /api/daily-problems/random
```
**설명**: 특정 날짜에 랜덤한 일일 문제를 생성합니다.

**Query Parameters:**
- `problemDate` (필수): 문제 날짜 (YYYY-MM-DD)

### **34. 일일 문제 비활성화 (관리자용)**
```http
DELETE /api/daily-problems/{date}
```
**설명**: 특정 날짜의 일일 문제를 비활성화합니다.

**Path Parameters:**
- `date`: 날짜 (YYYY-MM-DD 형식)

---

## 🏆 **게임화 시스템 API**

### **35. 내 포인트 정보 조회**
```http
GET /api/points/my
```
**설명**: 현재 사용자의 포인트 정보를 조회합니다.

**응답 예시:**
```json
{
  "success": true,
  "message": "포인트 정보를 조회했습니다.",
  "data": {
    "userId": 1,
    "nickname": "코딩마스터",
    "currentPoints": 1250,
    "currentLevel": "INTERMEDIATE",
    "levelDisplayName": "중급자",
    "levelEmoji": "🔥",
    "levelColor": "#FF9800",
    "pointsToNextLevel": 250,
    "nextLevel": "ADVANCED",
    "nextLevelDisplayName": "고급자",
    "totalPointsEarned": 1500,
    "totalPointsSpent": 250
  }
}
```

### **36. 다른 사용자 포인트 정보 조회**
```http
GET /api/points/user/{userId}
```
**설명**: 특정 사용자의 포인트 정보를 조회합니다.

### **37. 포인트 획득 가이드 조회**
```http
GET /api/points/guide
```
**설명**: 포인트 획득 방법 가이드를 조회합니다.

**응답 예시:**
```json
{
  "success": true,
  "message": "포인트 획득 가이드를 조회했습니다.",
  "data": {
    "activities": [
      {
        "activity": "게시글 작성",
        "points": 10,
        "description": "새로운 게시글을 작성하면 10포인트를 획득합니다."
      },
      {
        "activity": "댓글 작성",
        "points": 5,
        "description": "댓글을 작성하면 5포인트를 획득합니다."
      },
      {
        "activity": "좋아요 받기",
        "points": 2,
        "description": "게시글이나 스니펫에 좋아요를 받으면 2포인트를 획득합니다."
      },
      {
        "activity": "쉬운 문제 해결",
        "points": 10,
        "description": "쉬운 난이도의 문제를 해결하면 10포인트를 획득합니다."
      },
      {
        "activity": "보통 문제 해결",
        "points": 20,
        "description": "보통 난이도의 문제를 해결하면 20포인트를 획득합니다."
      },
      {
        "activity": "어려운 문제 해결",
        "points": 30,
        "description": "어려운 난이도의 문제를 해결하면 30포인트를 획득합니다."
      },
      {
        "activity": "전문가 문제 해결",
        "points": 50,
        "description": "전문가 난이도의 문제를 해결하면 50포인트를 획득합니다."
      }
    ]
  }
}
```

### **38. 내 뱃지 목록 조회**
```http
GET /api/badges/my
```
**설명**: 현재 사용자가 획득한 뱃지 목록을 조회합니다.

### **39. 내 대표 뱃지 목록 조회**
```http
GET /api/badges/my/featured
```
**설명**: 현재 사용자가 대표로 설정한 뱃지 목록을 조회합니다.

### **40. 뱃지 대표 설정/해제**
```http
PUT /api/badges/{badgeId}/feature
```
**설명**: 특정 뱃지를 대표 뱃지로 설정하거나 해제합니다.

**Query Parameters:**
- `featured` (필수): `true` | `false`

### **41. 뱃지 통계 조회**
```http
GET /api/badges/statistics
```
**설명**: 뱃지 관련 통계를 조회합니다.

### **42. 사용자 레벨 정보 조회**
```http
GET /api/users/levels
```
**설명**: 사용 가능한 레벨 정보를 조회합니다.

### **43. 사용자 랭킹 조회**
```http
GET /api/users/ranking
```
**설명**: 포인트 기준 사용자 랭킹을 조회합니다.

**Query Parameters:**
- `page` (선택): 페이지 번호
- `size` (선택): 페이지 크기

### **44. 레벨별 통계 조회**
```http
GET /api/users/level-stats
```
**설명**: 각 레벨별 사용자 통계를 조회합니다.

---

## 📊 **응답 형식**

### **성공 응답**
```json
{
  "success": true,
  "message": "작업이 성공적으로 완료되었습니다.",
  "data": { ... }
}
```

### **에러 응답**
```json
{
  "success": false,
  "message": "오류 메시지",
  "errorCode": "ERROR_CODE"
}
```

### **페이징 응답**
```json
{
  "success": true,
  "message": "데이터를 조회했습니다.",
  "data": {
    "content": [ ... ],
    "totalElements": 100,
    "totalPages": 5,
    "currentPage": 0,
    "size": 20,
    "first": true,
    "last": false
  }
}
```

---

## 🔧 **상태 코드**

- `200`: 성공
- `400`: 잘못된 요청
- `401`: 인증 실패
- `403`: 권한 없음
- `404`: 리소스 없음
- `500`: 서버 오류

---

## 📝 **참고사항**

1. **인증**: 모든 API는 JWT 토큰 인증이 필요합니다.
2. **페이징**: 페이징이 지원되는 API는 `page`와 `size` 파라미터를 사용합니다.
3. **날짜 형식**: 날짜는 ISO 8601 형식 (YYYY-MM-DD)을 사용합니다.
4. **에러 처리**: 에러 발생 시 `errorCode`를 통해 구체적인 오류를 확인할 수 있습니다.
5. **포인트 시스템**: 문제 해결, 게시글 작성, 댓글 작성 등 다양한 활동으로 포인트를 획득할 수 있습니다.
6. **레벨 시스템**: 포인트에 따라 자동으로 레벨이 상승합니다.
7. **뱃지 시스템**: 특정 조건을 달성하면 뱃지를 획득할 수 있습니다.

---

## 🚀 **시작하기**

1. **회원가입/로그인**: 먼저 사용자 계정을 생성하고 로그인합니다.
2. **JWT 토큰 획득**: 로그인 후 받은 JWT 토큰을 모든 API 요청에 포함합니다.
3. **문제 풀기**: 문제 목록에서 원하는 문제를 선택하고 코드를 제출합니다.
4. **AI 활용**: AI 기능을 활용하여 코드 품질을 평가받고 최적화 방안을 받아보세요.
5. **포인트 획득**: 다양한 활동을 통해 포인트를 획득하고 레벨을 올려보세요.

---

**문서 버전**: 1.0
**최종 업데이트**: 2025년 08월 06일
**API 기본 URL**: `http://localhost:8080`

## 🚨 **Jackson 직렬화 오류 발견!**

로그를 보니 **Jackson 직렬화 오류**가 발생하고 있습니다:

```
<code_block_to_apply_changes_from>
```

**문제**: 내부 클래스 `CodeQualityReport`에 `@Data` 어노테이션이 없어서 Jackson이 직렬화할 수 없습니다.

## 🔧 **해결 방법**

AICodeEvaluationService의 내부 클래스들에 `@Data` 어노테이션을 추가하겠습니다.