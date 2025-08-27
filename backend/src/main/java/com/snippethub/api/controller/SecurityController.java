package com.snippethub.api.controller;

import com.snippethub.api.dto.ApiResponse;
import com.snippethub.api.security.CodeExecutionSecurityFilter;
import com.snippethub.api.security.SecurityTestUtils;
import com.snippethub.api.security.RateLimitFilter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/security")
@RequiredArgsConstructor
@Slf4j
public class SecurityController {

    @Value("${rate.limiting.enabled:true}")
    private boolean rateLimitingEnabled;

    @Value("${rate.limiting.default-limit:100}")
    private int defaultLimit;

    @Value("${rate.limiting.default-window:60}")
    private int defaultWindow;

    @Value("${rate.limiting.ai-api-limit:10}")
    private int aiApiLimit;

    @Value("${rate.limiting.ai-api-window:60}")
    private int aiApiWindow;

    @Value("${rate.limiting.code-execution-limit:5}")
    private int codeExecutionLimit;

    @Value("${rate.limiting.code-execution-window:60}")
    private int codeExecutionWindow;

    @Value("${rate.limiting.auth-limit:5}")
    private int authLimit;

    @Value("${rate.limiting.auth-window:300}")
    private int authWindow;

    @Value("${code.execution.enabled:true}")
    private boolean codeExecutionEnabled;

    @Value("${security.audit.enabled:true}")
    private boolean auditEnabled;

    @Value("${security.input.validation.enabled:true}")
    private boolean inputValidationEnabled;

    private final CodeExecutionSecurityFilter codeExecutionSecurityFilter;
    private final SecurityTestUtils securityTestUtils;
    private final RateLimitFilter rateLimitFilter;

    @GetMapping("/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSecurityStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("rateLimitingEnabled", rateLimitingEnabled);
        status.put("codeExecutionEnabled", codeExecutionEnabled);
        status.put("auditEnabled", auditEnabled);
        status.put("inputValidationEnabled", inputValidationEnabled);
        status.put("timestamp", System.currentTimeMillis());
        
        return ResponseEntity.ok(ApiResponse.success("보안 상태를 조회했습니다.", status));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSecurityStats() {
        Map<String, Object> stats = new HashMap<>();
        
        // 기본 보안 통계 (실제 구현에서는 데이터베이스에서 조회)
        stats.put("totalRequests", 0);
        stats.put("blockedRequests", 0);
        stats.put("rateLimitExceeded", 0);
        stats.put("maliciousCodeBlocked", 0);
        stats.put("lastUpdated", System.currentTimeMillis());
        
        return ResponseEntity.ok(ApiResponse.success("보안 통계를 조회했습니다.", stats));
    }

    @GetMapping("/rate-limit/config")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRateLimitConfig() {
        Map<String, Object> config = new HashMap<>();
        
        config.put("enabled", rateLimitingEnabled);
        config.put("default", Map.of(
            "limit", defaultLimit,
            "window", defaultWindow,
            "description", "일반 API 요청 제한"
        ));
        config.put("aiApi", Map.of(
            "limit", aiApiLimit,
            "window", aiApiWindow,
            "description", "AI API 요청 제한 (리소스 보호)"
        ));
        config.put("codeExecution", Map.of(
            "limit", codeExecutionLimit,
            "window", codeExecutionWindow,
            "description", "코드 실행 요청 제한 (시스템 보호)"
        ));
        config.put("auth", Map.of(
            "limit", authLimit,
            "window", authWindow,
            "description", "인증 요청 제한 (무차별 대입 공격 방지)"
        ));
        
        return ResponseEntity.ok(ApiResponse.success("Rate Limit 설정을 조회했습니다.", config));
    }

    @GetMapping("/rate-limit/buckets")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRateLimitBuckets() {
        try {
            // RateLimitFilter에서 현재 버킷 상태를 가져오는 메서드 호출
            Map<String, Object> buckets = rateLimitFilter.getCurrentBucketsStatus();
            
            return ResponseEntity.ok(ApiResponse.success("Rate Limit 버킷 상태를 조회했습니다.", buckets));
        } catch (Exception e) {
            log.error("Rate Limit 버킷 상태 조회 중 오류 발생", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Rate Limit 버킷 상태 조회 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }

    @GetMapping("/rate-limit/ip/{ipAddress}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRateLimitForIp(@PathVariable String ipAddress) {
        try {
            Map<String, Object> ipStatus = rateLimitFilter.getRateLimitStatusForIp(ipAddress);
            
            return ResponseEntity.ok(ApiResponse.success("IP별 Rate Limit 상태를 조회했습니다.", ipStatus));
        } catch (Exception e) {
            log.error("IP별 Rate Limit 상태 조회 중 오류 발생", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("IP별 Rate Limit 상태 조회 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }

    @PostMapping("/rate-limit/reset/{ipAddress}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> resetRateLimitForIp(@PathVariable String ipAddress) {
        try {
            rateLimitFilter.resetRateLimitForIp(ipAddress);
            
            return ResponseEntity.ok(ApiResponse.success("IP의 Rate Limit을 초기화했습니다.", 
                "IP " + ipAddress + "의 Rate Limit이 초기화되었습니다."));
        } catch (Exception e) {
            log.error("IP Rate Limit 초기화 중 오류 발생", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("IP Rate Limit 초기화 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }

    @PostMapping("/rate-limit/reset/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> resetAllRateLimits() {
        try {
            int resetCount = rateLimitFilter.resetAllRateLimits();
            
            return ResponseEntity.ok(ApiResponse.success("모든 Rate Limit을 초기화했습니다.", 
                resetCount + "개의 Rate Limit 버킷이 초기화되었습니다."));
        } catch (Exception e) {
            log.error("전체 Rate Limit 초기화 중 오류 발생", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("전체 Rate Limit 초기화 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }

    @PostMapping("/test")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> testSecurityFeatures() {
        try {
            log.info("보안 기능 테스트 시작");
            
            // 코드 실행 보안 테스트
            securityTestUtils.runSecurityTests(codeExecutionSecurityFilter);
            
            // 특정 패턴 테스트
            securityTestUtils.testSpecificPatterns(codeExecutionSecurityFilter);
            
            // 보안 리포트 생성
            String report = securityTestUtils.generateSecurityReport(codeExecutionSecurityFilter);
            
            log.info("보안 기능 테스트 완료");
            
            return ResponseEntity.ok(ApiResponse.success("보안 테스트가 완료되었습니다.", report));
            
        } catch (Exception e) {
            log.error("보안 테스트 중 오류 발생", e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("보안 테스트 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }

    @PostMapping("/test/code")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> testCodeExecutionSecurity(@RequestBody Map<String, String> request) {
        try {
            String testCode = request.get("code");
            String language = request.get("language");
            
            if (testCode == null || language == null) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("코드와 언어를 모두 제공해야 합니다."));
            }
            
            log.info("코드 실행 보안 테스트 시작 - 언어: {}", language);
            
            // 코드 실행 보안 테스트
            String result = securityTestUtils.testCodeExecutionSecurity(codeExecutionSecurityFilter, testCode, language);
            
            return ResponseEntity.ok(ApiResponse.success("코드 실행 보안 테스트가 완료되었습니다.", result));
            
        } catch (Exception e) {
            log.error("코드 실행 보안 테스트 중 오류 발생", e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("코드 실행 보안 테스트 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }

    @PutMapping("/settings")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateSecuritySettings(@RequestBody Map<String, Object> settings) {
        try {
            // 실제 구현에서는 설정을 동적으로 업데이트
            log.info("보안 설정 업데이트 요청: {}", settings);
            
            Map<String, Object> result = new HashMap<>();
            result.put("message", "보안 설정이 업데이트되었습니다.");
            result.put("updatedSettings", settings);
            result.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.ok(ApiResponse.success("보안 설정이 업데이트되었습니다.", result));
            
        } catch (Exception e) {
            log.error("보안 설정 업데이트 중 오류 발생", e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("보안 설정 업데이트 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSecurityHealth() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "healthy");
        health.put("securityFeatures", Map.of(
            "rateLimiting", rateLimitingEnabled ? "enabled" : "disabled",
            "codeExecution", codeExecutionEnabled ? "enabled" : "disabled",
            "audit", auditEnabled ? "enabled" : "disabled",
            "inputValidation", inputValidationEnabled ? "enabled" : "disabled"
        ));
        health.put("timestamp", System.currentTimeMillis());
        
        return ResponseEntity.ok(ApiResponse.success("보안 시스템이 정상 작동 중입니다.", health));
    }
}
