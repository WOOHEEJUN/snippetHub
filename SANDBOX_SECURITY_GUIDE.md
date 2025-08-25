# Sandbox Security Monitoring Guide

## 개요
이 문서는 AWS 배포 환경에서 코드 실행 샌드박스의 생성과 폐기 과정이 제대로 작동하는지 확인하는 방법들을 설명합니다.

## 1. 로그 모니터링

### 1.1 애플리케이션 로그 확인 (AWS EC2)
```bash
# EC2 인스턴스에 SSH 접속
ssh -i your-key.pem ubuntu@your-ec2-ip

# Spring Boot 애플리케이션 로그에서 샌드박스 관련 메시지 확인
sudo journalctl -u snippethub-backend -f | grep -i sandbox

# 또는 로그 파일 직접 확인
sudo tail -f /var/log/snippethub-backend.log | grep -i sandbox

# 샌드박스 생성 로그 패턴
sudo journalctl -u snippethub-backend | grep "Creating sandbox environment"

# 샌드박스 정리 로그 패턴
sudo journalctl -u snippethub-backend | grep "Successfully cleaned up secure sandbox"

# 샌드박스 오류 로그 패턴
sudo journalctl -u snippethub-backend | grep "Error cleaning up sandbox"
```

### 1.2 로그 레벨 설정
`application.properties`에서 샌드박스 관련 로그 레벨을 DEBUG로 설정:
```properties
logging.level.com.snippethub.api.security=DEBUG
logging.level.com.snippethub.api.service.ExecutionService=DEBUG
```

## 2. API 엔드포인트를 통한 모니터링

### 2.1 샌드박스 상태 확인
```bash
# 샌드박스 상태 조회 (관리자 권한 필요)
curl -X GET "https://snippethub.co.kr/api/v1/admin/sandbox/status" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# 응답 예시:
{
  "success": true,
  "data": {
    "activeSandboxes": 0,
    "totalCreated": 150,
    "totalCleaned": 150,
    "failedCleanups": 0
  },
  "message": "Sandbox status retrieved successfully"
}
```

### 2.2 샌드박스 헬스 체크
```bash
# 샌드박스 헬스 상태 확인
curl -X GET "https://snippethub.co.kr/api/v1/admin/sandbox/health" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# 응답 예시:
{
  "success": true,
  "data": {
    "activeSandboxes": 0,
    "totalCreated": 150,
    "totalCleaned": 150,
    "failedCleanups": 0,
    "cleanupSuccessRate": 100.0,
    "status": "HEALTHY"
  },
  "message": "Sandbox health check completed"
}
```

### 2.3 고아 샌드박스 확인
```bash
# 고아 샌드박스 디렉토리 확인 및 정리
curl -X POST "https://snippethub.co.kr/api/v1/admin/sandbox/check-orphans" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 2.4 샌드박스 통계 로깅
```bash
# 샌드박스 통계를 로그에 출력
curl -X POST "https://snippethub.co.kr/api/v1/admin/sandbox/log-statistics" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## 3. 파일 시스템 모니터링 (AWS EC2)

### 3.1 EC2 인스턴스 접속
```bash
# NAT 인스턴스를 통한 백엔드 EC2 접속
ssh -i your-key.pem ubuntu@nat-instance-ip
ssh -i snippethub-KeyPair.pem ubuntu@10.0.3.74
```

### 3.2 샌드박스 디렉토리 확인
```bash
# 샌드박스 기본 디렉토리 확인
ls -la /tmp/snippethub_sandbox/

# 보안 임시 디렉토리 확인
ls -la /tmp/snippethub_secure/

# 디렉토리 크기 확인
du -sh /tmp/snippethub_sandbox/
du -sh /tmp/snippethub_secure/

# 디스크 사용량 확인
df -h /tmp
```

### 3.3 고아 디렉토리 확인
```bash
# 샌드박스 디렉토리 내의 모든 하위 디렉토리 확인
find /tmp/snippethub_sandbox/ -type d -maxdepth 1

# 각 하위 디렉토리의 파일 수 확인
for dir in /tmp/snippethub_sandbox/*/; do
  if [ -d "$dir" ]; then
    echo "$dir: $(find "$dir" -type f | wc -l) files"
  fi
done

# 오래된 샌드박스 디렉토리 찾기 (1시간 이상)
find /tmp/snippethub_sandbox/ -type d -maxdepth 1 -mmin +60
```

## 4. 보안 스크립트 실행 (AWS EC2)

### 4.1 종합 보안 점검 스크립트
```bash
# EC2 인스턴스에서 스크립트 실행
./sandbox-security-check.sh

# 로그 파일 확인
cat sandbox-security-check.log

# 또는 원격으로 실행
ssh -i your-key.pem ubuntu@your-ec2-ip "bash -s" < sandbox-security-check.sh
```

### 4.2 스크립트가 확인하는 항목들
- 샌드박스 디렉토리 존재 및 접근 권한
- 디렉토리 권한 설정 (700, 750 권장)
- 파일 및 디렉토리 개수
- 실행 중인 샌드박스 프로세스
- 시스템 리소스 사용량 (디스크, 메모리)
- 의심스러운 파일 패턴
- 실행 가능한 파일
- 심볼릭 링크
- 네트워크 연결

## 5. 프로세스 모니터링 (AWS EC2)

### 5.1 실행 중인 프로세스 확인
```bash
# Java 프로세스 확인
ps aux | grep java | grep sandbox

# Python 프로세스 확인
ps aux | grep python | grep sandbox

# Node.js 프로세스 확인
ps aux | grep node | grep sandbox

# 모든 샌드박스 관련 프로세스 확인
ps aux | grep -i sandbox

# 시스템 리소스 사용량 확인
top -p $(pgrep -f "java.*sandbox\|python.*sandbox\|node.*sandbox")
```

### 5.2 프로세스 리소스 사용량 확인
```bash
# 프로세스별 메모리 사용량
ps -eo pid,ppid,cmd,%mem,%cpu --sort=-%mem | head -20

# 특정 프로세스의 상세 정보
ps -p <PID> -o pid,ppid,cmd,%mem,%cpu,etime

# 메모리 사용량이 높은 프로세스 찾기
ps aux --sort=-%mem | head -10
```

## 6. 자동화된 모니터링 (AWS EC2)

### 6.1 크론 작업 설정
```bash
# crontab 편집
crontab -e

# 매 5분마다 샌드박스 상태 확인
*/5 * * * * /home/ubuntu/sandbox-security-check.sh >> /var/log/sandbox-monitor.log 2>&1

# 매 시간마다 고아 샌드박스 정리
0 * * * * curl -X POST "https://snippethub.co.kr/api/v1/admin/sandbox/check-orphans" -H "Authorization: Bearer YOUR_ADMIN_TOKEN" >> /var/log/sandbox-cleanup.log 2>&1

# 매일 자정에 샌드박스 통계 로깅
0 0 * * * curl -X POST "https://snippethub.co.kr/api/v1/admin/sandbox/log-statistics" -H "Authorization: Bearer YOUR_ADMIN_TOKEN" >> /var/log/sandbox-stats.log 2>&1
```

### 6.2 모니터링 스크립트 예시
```bash
#!/bin/bash
# sandbox-monitor.sh

# 샌드박스 상태 확인
STATUS=$(curl -s -X GET "https://snippethub.co.kr/api/v1/admin/sandbox/health" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN")

# 활성 샌드박스가 있으면 경고
ACTIVE_SANDBOXES=$(echo $STATUS | jq -r '.data.activeSandboxes')
if [ "$ACTIVE_SANDBOXES" -gt 0 ]; then
  echo "WARNING: $ACTIVE_SANDBOXES active sandboxes detected!"
  # 알림 발송 (이메일, 슬랙 등)
fi
```

## 7. 문제 해결 (AWS EC2)

### 7.1 일반적인 문제들

#### 샌드박스가 정리되지 않는 경우
```bash
# 수동으로 샌드박스 정리
sudo rm -rf /tmp/snippethub_sandbox/*
sudo rm -rf /tmp/snippethub_secure/*

# 권한 문제 확인
ls -la /tmp/snippethub_sandbox/

# 애플리케이션 재시작
sudo systemctl restart snippethub-backend
```

#### 디스크 공간 부족
```bash
# 디스크 사용량 확인
df -h

# 큰 파일 찾기
find /tmp -type f -size +100M

# 오래된 파일 찾기
find /tmp -type f -mtime +7

# /tmp 디렉토리 정리
sudo find /tmp -type f -mtime +1 -delete
```

#### 권한 문제
```bash
# 디렉토리 권한 수정
sudo chmod 700 /tmp/snippethub_sandbox/
sudo chmod 700 /tmp/snippethub_secure/

# 소유자 확인 및 수정
sudo chown -R ubuntu:ubuntu /tmp/snippethub_sandbox/
sudo chown -R ubuntu:ubuntu /tmp/snippethub_secure/
```

### 7.2 로그 분석
```bash
# 샌드박스 관련 오류 로그 분석
sudo journalctl -u snippethub-backend | grep -i "error.*sandbox" | tail -20

# 샌드박스 생성/정리 패턴 분석
sudo journalctl -u snippethub-backend | grep -E "(created|cleaned up).*sandbox" | tail -20

# 특정 시간대의 샌드박스 활동 확인
sudo journalctl -u snippethub-backend --since "2024-01-15" | grep sandbox
```

## 8. 보안 체크리스트

### 8.1 일일 점검 항목
- [ ] 활성 샌드박스 개수 확인
- [ ] 샌드박스 정리 성공률 확인
- [ ] 디스크 사용량 확인
- [ ] 의심스러운 파일 존재 여부 확인
- [ ] 실행 중인 샌드박스 프로세스 확인

### 8.2 주간 점검 항목
- [ ] 샌드박스 통계 분석
- [ ] 고아 디렉토리 정리
- [ ] 로그 패턴 분석
- [ ] 보안 스크립트 실행
- [ ] 권한 설정 검토

### 8.3 월간 점검 항목
- [ ] 샌드박스 정책 검토
- [ ] 보안 설정 업데이트
- [ ] 모니터링 도구 개선
- [ ] 백업 및 복구 절차 검토

## 9. 알림 설정

### 9.1 임계값 설정
- 활성 샌드박스 > 10개
- 정리 실패율 > 5%
- 디스크 사용량 > 80%
- 메모리 사용량 > 80%

### 9.2 알림 방법
- 이메일 알림
- 슬랙/팀즈 알림
- SMS 알림
- AWS SNS 알림
- 로그 모니터링 도구 연동

## 10. AWS 특화 모니터링

### 10.1 CloudWatch 모니터링
```bash
# CloudWatch 메트릭 확인
aws cloudwatch get-metric-statistics \
  --namespace AWS/EC2 \
  --metric-name CPUUtilization \
  --dimensions Name=InstanceId,Value=i-1234567890abcdef0 \
  --start-time 2024-01-15T00:00:00Z \
  --end-time 2024-01-15T23:59:59Z \
  --period 300 \
  --statistics Average
```

### 10.2 AWS Systems Manager 사용
```bash
# SSM을 통한 원격 명령 실행
aws ssm send-command \
  --instance-ids "i-1234567890abcdef0" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["ls -la /tmp/snippethub_sandbox/"]'
```

이 가이드를 통해 AWS 배포 환경에서 샌드박스의 생성과 폐기 과정이 제대로 작동하는지 지속적으로 모니터링하고 문제를 조기에 발견할 수 있습니다.
