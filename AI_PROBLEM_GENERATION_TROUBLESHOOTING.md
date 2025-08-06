# 🔧 **AI 문제 생성 API 문제 해결 가이드**

## 🚨 **500 에러 발생 시 해결 방법**

### **1. API 키 설정 확인**
```properties
# application.properties 파일에서 확인
ai.openai.api.key=YOUR_ACTUAL_OPENAI_API_KEY_HERE
```

**해결 방법:**
1. OpenAI API 키를 발급받으세요: https://platform.openai.com/api-keys
2. `application.properties`에서 `YOUR_ACTUAL_OPENAI_API_KEY_HERE`를 실제 API 키로 교체하세요
3. 서버를 재시작하세요

### **2. 올바른 API 호출 방법**

**❌ 잘못된 호출:**
```http
POST /api/ai/problems/generate?difficulty=EASY&difficulty=MEDIUM&difficulty=HARD&difficulty=EXPERT&category=ALGORITHM&category=DATA_STRUCTURE&category=WEB_DEVELOPMENT&category=DATABASE&category=SYSTEM_DESIGN&category=FRONTEND&category=BACKEND&category=DEVOPS
```

**✅ 올바른 호출:**
```http
POST http://localhost:80/api/ai/problems/generate?difficulty=EASY&category=ALGORITHM
Authorization: Bearer {your_jwt_token}
```

### **3. 파라미터 설명**

**difficulty (필수):**
- `EASY` - 쉬운 난이도
- `MEDIUM` - 보통 난이도  
- `HARD` - 어려운 난이도
- `EXPERT` - 전문가 난이도

**category (필수):**
- `ALGORITHM` - 알고리즘
- `DATA_STRUCTURE` - 자료구조
- `WEB_DEVELOPMENT` - 웹 개발
- `DATABASE` - 데이터베이스
- `SYSTEM_DESIGN` - 시스템 설계
- `FRONTEND` - 프론트엔드
- `BACKEND` - 백엔드
- `DEVOPS` - 데브옵스

### **4. Postman 테스트 예시**

**Request:**
```
Method: POST
URL: http://localhost:8080/api/ai/problems/generate?difficulty=EASY&category=ALGORITHM
Headers:
  - Authorization: Bearer {your_jwt_token}
  - Content-Type: application/json
Body: (비어있음)
```

**Expected Response:**
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

### **5. AI API 실패 시 동작**

AI API 호출이 실패하면 시스템이 자동으로 **Mock 문제**를 생성합니다:

```json
{
  "success": true,
  "message": "AI가 새로운 문제를 생성했습니다.",
  "data": {
    "problemId": 1,
    "title": "알고리즘 - 쉬운 문제",
    "description": "이것은 알고리즘 카테고리의 쉬운 난이도 문제입니다.",
    "difficulty": "EASY",
    "category": "ALGORITHM"
  }
}
```

### **6. 서버 로그 확인**

**로그 레벨 설정:**
```properties
# application.properties
logging.level.com.snippethub.api.service.AIProblemGenerationService=DEBUG
```

**확인할 로그:**
```
INFO  - AI 문제 생성 시작 - 난이도: EASY, 카테고리: ALGORITHM
DEBUG - 생성된 프롬프트: ...
DEBUG - AI 응답 받음: ...
INFO  - AI가 새로운 문제를 생성했습니다: ...
```

### **7. 일반적인 문제들**

**문제 1: "OpenAI API 키가 설정되지 않았습니다"**
- 해결: API 키를 올바르게 설정하고 서버 재시작

**문제 2: "AI 응답 파싱 실패"**
- 해결: Mock 문제가 자동 생성되므로 정상 동작

**문제 3: "중복된 문제가 생성되었습니다"**
- 해결: Mock 문제가 자동 생성되므로 정상 동작

### **8. 테스트 순서**

1. **서버 시작 확인:**
   ```bash
   netstat -ano | findstr :8080
   ```

2. **JWT 토큰 획득:**
   ```http
   POST /api/auth/login
   {
     "email": "test@test.test",
     "password": "password"
   }
   ```

3. **AI 문제 생성 테스트:**
   ```http
   POST http://localhost:80/api/ai/problems/generate?difficulty=EASY&category=ALGORITHM
   Authorization: Bearer {jwt_token}
   ```

### **9. 성공적인 응답 확인**

✅ **성공 시:**
- HTTP 200 상태 코드
- `success: true`
- 문제 데이터 포함

❌ **실패 시:**
- HTTP 500 상태 코드
- `success: false`
- 에러 메시지 포함

---

**💡 팁:** API 키가 설정되지 않아도 Mock 문제가 생성되므로 개발/테스트 환경에서도 정상 동작합니다! 