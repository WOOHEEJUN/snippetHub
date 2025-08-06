# 🧪 **AI 코드 평가 API 테스트 가이드**

## 🚨 **Jackson 직렬화 오류 해결**

**문제**: `No serializer found for class CodeQualityReport` 오류
**해결**: 내부 클래스에 `@Data` 어노테이션 추가 완료

## 🎯 **테스트용 API 호출 예시**

### **1. 코드 품질 평가**

**Python 코드 테스트:**
```http
POST /api/ai/evaluate/code-quality?code=def%20find_max(arr):%0A%20%20%20%20return%20max(arr)&language=python&problemId=1
```

**Java 코드 테스트:**
```http
POST /api/ai/evaluate/code-quality?code=public%20int%20findMax(int[]%20arr)%20{%0A%20%20%20%20int%20max%20=%20arr[0];%0A%20%20%20%20for%20(int%20i%20=%201;%20i%20<%20arr.length;%20i++)%20{%0A%20%20%20%20%20%20%20%20if%20(arr[i]%20>%20max)%20max%20=%20arr[i];%0A%20%20%20%20}%0A%20%20%20%20return%20max;%0A}&language=java&problemId=1
```

### **2. 코드 최적화 제안**

**Python 코드 최적화:**
```http
POST /api/ai/suggest/optimization?code=def%20find_max(arr):%0A%20%20%20%20return%20max(arr)&language=python&problemId=1
```

**Java 코드 최적화:**
```http
POST /api/ai/suggest/optimization?code=public%20int%20findMax(int[]%20arr)%20{%0A%20%20%20%20int%20max%20=%20arr[0];%0A%20%20%20%20for%20(int%20i%20=%201;%20i%20<%20arr.length;%20i++)%20{%0A%20%20%20%20%20%20%20%20if%20(arr[i]%20>%20max)%20max%20=%20arr[i];%0A%20%20%20%20}%0A%20%20%20%20return%20max;%0A}&language=java&problemId=1
```

### **3. 코드 설명 생성**

**Python 코드 설명:**
```http
POST /api/ai/explain/code?code=def%20find_max(arr):%0A%20%20%20%20return%20max(arr)&language=python
```

**Java 코드 설명:**
```http
POST /api/ai/explain/code?code=public%20int%20findMax(int[]%20arr)%20{%0A%20%20%20%20int%20max%20=%20arr[0];%0A%20%20%20%20for%20(int%20i%20=%201;%20i%20<%20arr.length;%20i++)%20{%0A%20%20%20%20%20%20%20%20if%20(arr[i]%20>%20max)%20max%20=%20arr[i];%0A%20%20%20%20}%0A%20%20%20%20return%20max;%0A}&language=java
```

### **4. 학습 경로 제안**

```http
POST /api/ai/suggest/learning-path
```

## 📝 **Postman에서 쉽게 테스트**

### **코드 품질 평가 테스트**

**Request 설정:**
```
Method: POST
URL: http://localhost:80/api/ai/evaluate/code-quality
Query Params:
  code: def find_max(arr):
            return max(arr)
  language: python
  problemId: 1
Headers:
  Authorization: Bearer {your_jwt_token}
  Content-Type: application/json
```

### **예상 응답:**
```json
{
  "success": true,
  "message": "코드 품질 평가가 완료되었습니다.",
  "data": {
    "score": 8.5,
    "feedback": "전반적으로 좋은 코드입니다. 다만 메모리 사용량을 줄일 수 있습니다.",
    "improvements": [
      "메모리 최적화",
      "변수명 개선"
    ]
  }
}
```

## 🧪 **간단한 테스트 코드들**

### **Python 테스트 코드들**

**1. 기본 함수:**
```python
def hello():
    print("Hello World")
```

**2. 배열 최대값 찾기:**
```python
def find_max(arr):
    if not arr:
        return None
    return max(arr)
```

**3. 팩토리얼 계산:**
```python
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n-1)
```

### **Java 테스트 코드들**

**1. 기본 함수:**
```java
public void hello() {
    System.out.println("Hello World");
}
```

**2. 배열 최대값 찾기:**
```java
public int findMax(int[] arr) {
    if (arr.length == 0) return -1;
    int max = arr[0];
    for (int num : arr) {
        if (num > max) max = num;
    }
    return max;
}
```

**3. 팩토리얼 계산:**
```java
public int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n-1);
}
```

## 🎯 **테스트 순서**

1. **서버 상태 확인:**
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

3. **코드 품질 평가 테스트:**
   ```http
   POST http://localhost:80/api/ai/evaluate/code-quality?code=print("Hello")&language=python&problemId=1
   ```

4. **다른 AI 기능들 테스트**

## ✅ **성공적인 응답 확인**

- **HTTP 200** 상태 코드
- **success: true**
- **적절한 평가 결과** 포함

## 🚨 **문제 해결**

**500 에러 발생 시:**
1. 서버 로그 확인
2. 파라미터 형식 확인
3. JWT 토큰 유효성 확인

**Jackson 직렬화 오류:**
- ✅ **해결됨**: 내부 클래스에 `@Data` 어노테이션 추가
- 이제 정상적으로 JSON 응답 생성

**Mock 응답 확인:**
- AI API가 설정되지 않아도 Mock 응답이 반환됨
- 개발/테스트 환경에서 정상 동작

---

**💡 팁:** Postman의 Query Params 탭을 사용하면 URL 인코딩을 자동으로 처리해줍니다! 