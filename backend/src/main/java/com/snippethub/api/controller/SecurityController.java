package com.snippethub.api.controller;

import com.snippethub.api.dto.ApiResponse;
import com.snippethub.api.security.CodeExecutionSecurityFilter;
import com.snippethub.api.security.SecurityTestUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/security")
@RequiredArgsConstructor
@Slf4j
public class SecurityController {

    @Value("${rate.limiting.enabled:true}")
    private boolean rateLimitingEnabled;

    @Value("${code.execution.enabled:true}")
    private boolean codeExecutionEnabled;

    @Value("${security.audit.enabled:true}")
    private boolean auditEnabled;

    @Value("${security.input.validation.enabled:true}")
    private boolean inputValidationEnabled;

    private final CodeExecutionSecurityFilter codeExecutionSecurityFilter;
    private final SecurityTestUtils securityTestUtils;

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
    public ResponseEntity<ApiResponse<Map<String, Object>>> testCodeSecurity(@RequestBody Map<String, String> request) {
        try {
            String code = request.get("code");
            String language = request.get("language");
            
            if (code == null || language == null) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("코드와 언어를 모두 제공해주세요."));
            }
            
            boolean isValid = codeExecutionSecurityFilter.validateCodeContent(code, language);
            
            Map<String, Object> result = new HashMap<>();
            result.put("code", code);
            result.put("language", language);
            result.put("isValid", isValid);
            result.put("timestamp", System.currentTimeMillis());
            
            String message = isValid ? "코드가 안전합니다." : "코드가 보안 정책에 위배됩니다.";
            
            return ResponseEntity.ok(ApiResponse.success(message, result));
            
        } catch (Exception e) {
            log.error("코드 보안 테스트 중 오류 발생", e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("코드 보안 테스트 중 오류가 발생했습니다: " + e.getMessage()));
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
