SnippetHub 프로젝트 보안 기술 구현 보고서

1. 다층 방어 체계 (Defense in Depth) 구현

1.1 Rate Limiting 시스템 구현
RateLimitFilter 클래스를 통해 IP 기반 요청 제한 시스템을 구축. 토큰 버킷 알고리즘을 적용하여 엔드포인트별로 차등화된 제한을 구현.

구현 내용:
- AI API: 10회/분 (AI 리소스 보호)
- 코드 실행: 5회/분 (시스템 리소스 보호)
- 일반 API: 100회/분 (일반 사용자 활동)
- 인증: 5회/5분 (무차별 대입 공격 방지)

동적 윈도우 관리 시스템으로 시간 기반 토큰 버킷을 구현하여 효율적인 리소스 관리와 공격 방지를 동시에 달성.

1.2 코드 실행 보안 필터 시스템 구현
CodeExecutionSecurityFilter 클래스에서 100개 이상의 정규식 패턴을 정의하여 포괄적인 위험 코드 차단 시스템을 구축.

구현된 위험 패턴 분류:
- 시스템 명령어 차단: rm, sudo, chmod, kill, shutdown, reboot 등
- Windows 명령어 차단: del, format, taskkill, netsh 등
- 함수 실행 차단: eval, exec, system, Runtime.getRuntime, ProcessBuilder 등
- 브라우저 API 차단: document.write, window.open, localStorage 등
- 파일 시스템 접근 차단: /etc/, /var/, C:, .. 등
- 네트워크 접근 차단: http://, socket, connect, requests 등
- 무한 루프 차단: while(true), for(;;), loop 등
- 명령어 치환 차단: ${command}, $(command), backticks 등
- 리플렉션 차단: Class.forName, getDeclaredMethod, invoke 등
- 프로세스 관리 차단: Process, Thread, fork, clone 등

코드 정규화 시스템을 구현하여 인코딩 우회 공격을 방지:
- 유니코드 정규화 (NFC)
- URL 디코딩
- HTML 엔티티 디코딩
- 이스케이프 시퀀스 디코딩
- 공백 문자 정규화

요청 검증 시스템:
- Content-Type: application/json 필수 검증
- Content-Length: 1MB 이하 제한
- User-Agent: 필수 헤더 검증
- Referer: 허용된 도메인만 접근 가능
- CSRF 방지: 리퍼러 기반 출처 검증

2. 샌드박스 격리 시스템 구현

2.1 샌드박스 생성 및 관리 시스템
CodeExecutionSandbox 클래스에서 고유 ID 기반 샌드박스 디렉토리 생성 시스템을 구현. 각 코드 실행마다 UUID를 생성하여 완전히 격리된 실행 환경을 제공.

구현 내용:
- 고유 ID 기반 샌드박스 디렉토리 생성 (/tmp/snippethub_sandbox/{UUID})
- 언어별 실행 환경 격리
- POSIX/Windows 권한 설정
- 심볼릭 링크 방지

2.2 실행 환경 제한 시스템
실행 시간과 메모리를 엄격하게 제한하여 시스템 리소스 보호를 구현:
- 최대 실행 시간: 10초
- 최대 메모리: 512MB
- 코드 길이 제한: 10KB

2.3 샌드박스 모니터링 시스템
SandboxMonitor 클래스를 통해 샌드박스 생명주기를 추적하는 모니터링 시스템을 구현:
- 샌드박스 생성/정리 이벤트 추적
- 고아 디렉토리 감지
- 통계 정보 수집

3. 인증 및 권한 관리 시스템 구현

3.1 JWT 토큰 기반 인증 시스템
JwtRequestFilter, JwtUtil, TokenProvider 클래스를 통해 안전한 JWT 토큰 시스템을 구현.

구현 내용:
- 액세스 토큰 유효기간: 24시간 (86400초)
- 리프레시 토큰 유효기간: 30일 (2592000초)
- HS512 알고리즘 사용
- Base64 인코딩된 시크릿 키
- TokenBlacklist를 통한 로그아웃된 토큰 관리

3.2 OAuth2 소셜 로그인 시스템
CustomOAuth2UserService 클래스에서 Google과 Kakao OAuth2 연동 시스템을 구현:
- 클라이언트 ID/시크릿 환경변수 관리
- 리다이렉트 URI 검증
- 이메일 정보 필수 요구

3.3 비밀번호 관리 시스템
BCrypt 암호화 알고리즘을 사용하여 안전한 비밀번호 관리 시스템을 구현:
- 비밀번호 재설정 토큰 시스템
- 이메일 인증 토큰 시스템
- Stateless 세션 정책 적용

4. 입력 검증 및 보안 헤더 시스템 구현

4.1 입력 검증 필터 시스템
InputValidationFilter 클래스에서 다층 입력 검증 시스템을 구현:
- SQL Injection 방지
- XSS 공격 방지
- Path Traversal 방지
- 악성 헤더 차단
- 정규식 기반 악성 패턴 감지

4.2 보안 헤더 필터 시스템
SecurityHeadersFilter 클래스에서 포괄적인 보안 헤더 시스템을 구현:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Content Security Policy 설정
- HSTS 헤더 (HTTPS 환경)
- Cache Control 헤더

5. 감사 로깅 및 모니터링 시스템 구현

5.1 감사 로그 필터 시스템
AuditLogFilter 클래스에서 보안 이벤트 로깅 시스템을 구현:
- 보안 관련 이벤트 로깅
- 민감한 엔드포인트 모니터링
- 고위험 이벤트 감지
- IP 주소 및 사용자 정보 추적

5.2 보안 모니터링 시스템
SecurityController 클래스를 통해 실시간 보안 모니터링 시스템을 구현:
- 보안 상태 조회 및 관리
- 동적 보안 설정 변경
- 통계 수집: 차단된 요청, 위반 사항 등

6. 코드 실행 보안 처리 흐름 구현

사용자 코드 입력부터 결과 반환까지 8단계 보안 처리 흐름을 구현:

1. 사용자 코드 입력
2. Rate Limit 체크 (IP 기반 요청 제한)
3. 보안 검증 (악성 코드 차단)
4. 고유한 샌드박스 버킷 생성 (/tmp/snippethub_sandbox/{UUID})
5. 샌드박스 내에서 코드 실행
6. 결과 반환
7. 샌드박스 완전 폐기 (finally 블록에서 자동 실행)
8. 다음 사용자를 위한 새로운 샌드박스 준비

실제 샌드박스 동작 검증 결과:
샌드박스 ID: b6f86537-085c-4cbe-b00f-db849bca0535
생성 시간: 2025-08-25T02:47:05.382Z
정리 시간: 2025-08-25T02:47:05.401Z
처리 시간: 19ms
모니터링 시스템 정상 작동

7. 데이터베이스 및 파일 시스템 보안 구현

7.1 데이터베이스 보안 시스템
AWS RDS MySQL을 사용하여 안전한 데이터베이스 환경을 구축:
- SSL/TLS 암호화 연결
- 환경변수 기반 접속 정보 관리
- JPA 엔티티 검증
- SQL Injection 방지 (JPA 사용)
- 트랜잭션 관리

7.2 파일 시스템 보안 시스템
AWS S3와 샌드박스 파일 시스템을 통해 안전한 파일 관리 환경을 구축:
- IAM 역할 기반 접근 제어
- 버킷 정책 설정
- 파일 업로드 크기 제한 (20MB)
- 임시 디렉토리 사용 (/tmp/snippethub_sandbox/)
- 고유 ID 기반 격리
- 실행 후 즉시 정리

8. 네트워크 보안 시스템 구현

8.1 CORS 설정 시스템
SecurityConfig 클래스에서 엄격한 CORS 정책을 구현:
- 허용된 도메인만 접근 가능
- Credentials 허용
- 특정 헤더 노출 제한

8.2 HTTPS 강제 시스템
SSL/TLS 인증서를 적용하여 안전한 통신 환경을 구축:
- HSTS 헤더 설정
- HTTP에서 HTTPS 리다이렉트

9. 이메일 보안 시스템 구현

EmailService 클래스에서 안전한 이메일 시스템을 구현:
- Gmail SMTP 사용
- TLS 암호화 연결
- 이메일 인증 토큰
- 비밀번호 재설정 토큰
- UUID 기반 토큰 생성
- 유효기간 설정 및 사용 후 즉시 삭제

10. 배포 환경 보안 시스템 구현

10.1 AWS 보안 시스템
AWS 클라우드 환경에서 포괄적인 보안 시스템을 구축:
- EC2 보안 그룹 설정
- RDS VPC 격리
- S3 버킷 정책
- IAM 역할 및 정책

10.2 환경변수 관리 시스템
민감한 정보를 환경변수로 관리하여 보안을 강화:
- JWT 시크릿 키
- 데이터베이스 접속 정보
- OAuth2 클라이언트 정보
- AWS 접근 키

11. 프론트엔드 보안 시스템 구현

11.1 React 보안 시스템
React 프레임워크의 기본 보안 기능을 활용하여 안전한 프론트엔드 환경을 구축:
- XSS 방지 (React 기본 제공)
- CSRF 토큰 관리
- 안전한 토큰 저장 (localStorage)
- 입력 검증

11.2 API 통신 보안 시스템
HTTPS 강제, Authorization 헤더 사용, 에러 처리 및 로깅을 통해 안전한 API 통신 환경을 구축.

결론

SnippetHub 프로젝트는 다층 방어 체계를 기반으로 한 포괄적인 보안 시스템을 구현했습니다. 특히 코드 실행 환경에서 다양한 위험 패턴을 차단하는 정규식 기반 필터링 시스템과 고유 ID 기반 샌드박스 격리 시스템을 통해 안전한 코드 실행 환경을 제공합니다. 실시간 모니터링과 감사 로깅을 통해 지속적인 보안 상태 추적이 가능하며, AWS 클라우드 환경에서 높은 수준의 보안을 구현하여 안전하고 신뢰할 수 있는 코드 실행 플랫폼을 구축했습니다.

