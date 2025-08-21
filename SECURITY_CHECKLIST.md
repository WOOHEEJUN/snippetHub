# 🔒 보안 체크리스트

GitHub에 프로젝트를 public으로 올리기 전에 다음 사항들을 확인하세요.

## ✅ 필수 확인 사항

### 1. 민감한 정보 제거
- [ ] `application.properties`에서 실제 API 키, 비밀번호 제거
- [ ] 하드코딩된 JWT secret 제거
- [ ] 데이터베이스 비밀번호 제거
- [ ] OAuth2 client secret 제거
- [ ] AWS credentials 제거
- [ ] 이메일 비밀번호 제거

### 2. 환경 변수 설정
- [ ] `application.properties.template` 파일 생성 완료
- [ ] 환경 변수 placeholder 설정 완료
- [ ] README.md에 환경 변수 설정 가이드 추가

### 3. .gitignore 설정
- [ ] `application.properties` 파일이 .gitignore에 포함됨
- [ ] `.env` 파일들이 .gitignore에 포함됨
- [ ] IDE 설정 파일들이 .gitignore에 포함됨
- [ ] 로그 파일들이 .gitignore에 포함됨

### 4. 문서 업데이트
- [ ] README.md 파일 생성 완료
- [ ] 설치 및 설정 가이드 포함
- [ ] 보안 주의사항 포함

## 🚨 즉시 조치 필요

### 현재 발견된 보안 문제들:
1. **JWT Secret Key** - Base64 인코딩되어 있지만 여전히 노출됨
2. **데이터베이스 비밀번호** - `SnippetHub2024!`
3. **Gmail 앱 비밀번호** - `ldgc fzxn usng pbnt`
4. **Kakao OAuth Client Secret** - `kEQe51cBmnah8ih9wk4xugBAXivGxsyS`
5. **Google OAuth Client Secret** - `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`
6. **OpenAI API Key** - `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`

## 🔧 해결 방법

### 1. application.properties 파일 수정
```properties
# 기존 하드코딩된 값들을 환경 변수로 변경
jwt.secret=${JWT_SECRET:your-jwt-secret-key-here}
spring.datasource.password=${DATABASE_PASSWORD:password}
spring.mail.password=${EMAIL_PASSWORD:your-app-password}
# ... 기타 민감한 정보들
```

### 2. 환경 변수 설정
- 로컬 개발: 환경 변수 또는 `.env` 파일 사용
- 프로덕션: AWS Systems Manager Parameter Store 또는 환경 변수 사용

### 3. API 키 재발급
- OpenAI API 키 재발급
- OAuth2 client secret 재발급
- 데이터베이스 비밀번호 변경

## 📋 배포 전 최종 체크

- [ ] 모든 민감한 정보가 제거되었는지 확인
- [ ] 환경 변수 템플릿이 올바르게 설정되었는지 확인
- [ ] .gitignore가 올바르게 설정되었는지 확인
- [ ] README.md가 완성되었는지 확인
- [ ] 로컬에서 애플리케이션이 정상 작동하는지 확인

## ⚠️ 주의사항

- **절대** 민감한 정보를 GitHub에 커밋하지 마세요
- 환경 변수를 사용하여 민감한 정보를 관리하세요
- 프로덕션 환경에서는 AWS Secrets Manager나 Parameter Store를 사용하세요
- 정기적으로 API 키를 로테이션하세요
