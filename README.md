# SnippetHub

코딩 문제 풀이와 스니펫 공유를 위한 웹 플랫폼입니다.

## 🚀 주요 기능

- **AI 코드 평가**: OpenAI API를 활용한 코드 품질 분석
- **문제 풀이**: 다양한 프로그래밍 문제 제공
- **스니펫 공유**: 코드 스니펫 작성 및 공유
- **OAuth2 로그인**: Google, Kakao 소셜 로그인 지원
- **실시간 알림**: WebSocket을 통한 실시간 알림
- **포인트 시스템**: 활동에 따른 포인트 적립 및 뱃지 시스템

## 🛠 기술 스택

### Backend
- **Spring Boot 3.x**
- **Spring Security** + JWT
- **Spring Data JPA**
- **MySQL 8.0**
- **WebSocket**
- **AWS S3**

### Frontend
- **React 18**
- **React Router**
- **Axios**
- **WebSocket**

### Infrastructure
- **AWS EC2**
- **AWS RDS**
- **AWS S3**
- **CloudFront**
- **Application Load Balancer**

## 📋 사전 요구사항

- Java 17+
- Node.js 18+
- MySQL 8.0+
- AWS 계정

## 🔧 설치 및 설정

### 1. 저장소 클론
```bash
git clone https://github.com/your-username/SnippetHub.git
cd SnippetHub
```

### 2. 환경 변수 설정

#### Backend 환경 변수
`backend/src/main/resources/application.properties` 파일을 생성하고 다음 환경 변수들을 설정하세요:

```properties
# JWT Configuration
jwt.secret=your-jwt-secret-key-here

# Database Configuration
spring.datasource.url=jdbc:mysql://your-database-host:3306/snippethub_db
spring.datasource.username=your-database-username
spring.datasource.password=your-database-password

# Email Configuration
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password

# AWS Configuration
cloud.aws.credentials.access-key=your-aws-access-key
cloud.aws.credentials.secret-key=your-aws-secret-key
cloud.aws.s3.bucket=your-s3-bucket-name

# OAuth2 Configuration
spring.security.oauth2.client.registration.kakao.client-id=your-kakao-client-id
spring.security.oauth2.client.registration.kakao.client-secret=your-kakao-client-secret
spring.security.oauth2.client.registration.google.client-id=your-google-client-id
spring.security.oauth2.client.registration.google.client-secret=your-google-client-secret

# AI API Configuration
ai.openai.api.key=your-openai-api-key
ai.claude.api.key=your-claude-api-key
```

#### Frontend 환경 변수
`frontend/.env` 파일을 생성하고 다음 환경 변수들을 설정하세요:

```env
REACT_APP_API_URL=http://localhost:8080/api
REACT_APP_WS_URL=ws://localhost:8080/ws
```

### 3. 데이터베이스 설정

MySQL에서 데이터베이스를 생성하세요:

```sql
CREATE DATABASE snippethub_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Backend 실행

```bash
cd backend
./gradlew bootRun
```

### 5. Frontend 실행

```bash
cd frontend
npm install
npm start
```

## 🚀 배포

### AWS 배포 가이드

1. **EC2 인스턴스 생성**
2. **RDS MySQL 데이터베이스 생성**
3. **S3 버킷 생성**
4. **CloudFront 배포 설정**
5. **Application Load Balancer 설정**

자세한 배포 가이드는 [DEPLOYMENT.md](./DEPLOYMENT.md)를 참조하세요.

## 📚 API 문서

API 문서는 [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)를 참조하세요.

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해 주세요.

## ⚠️ 보안 주의사항

- 민감한 정보(API 키, 비밀번호 등)는 절대 코드에 하드코딩하지 마세요
- 환경 변수를 사용하여 민감한 정보를 관리하세요
- 프로덕션 환경에서는 HTTPS를 사용하세요
