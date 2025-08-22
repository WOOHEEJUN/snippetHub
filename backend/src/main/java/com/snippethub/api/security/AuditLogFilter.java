package com.snippethub.api.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;

@Component
@Slf4j
public class AuditLogFilter extends OncePerRequestFilter {

    @Value("${security.audit.enabled:true}")
    private boolean auditEnabled;

    private static final List<String> SENSITIVE_ENDPOINTS = Arrays.asList(
        "/api/auth/login",
        "/api/auth/register", 
        "/api/v1/auth/login",
        "/api/v1/auth/register",
        "/api/v1/execute",
        "/api/execute",
        "/api/ai/evaluate-code",
        "/api/ai/problems/generate"
    );

    private static final List<String> SENSITIVE_METHODS = Arrays.asList("POST", "PUT", "DELETE");

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        long startTime = System.currentTimeMillis();
        String requestPath = request.getRequestURI();
        String method = request.getMethod();
        String clientIp = getClientIpAddress(request);
        String userAgent = request.getHeader("User-Agent");

        try {
            filterChain.doFilter(request, response);
        } finally {
            if (auditEnabled && shouldAudit(requestPath, method)) {
                long duration = System.currentTimeMillis() - startTime;
                logSecurityEvent(requestPath, method, clientIp, userAgent, response.getStatus(), duration);
            }
        }
    }

    private boolean shouldAudit(String requestPath, String method) {
        return SENSITIVE_ENDPOINTS.stream().anyMatch(requestPath::startsWith) ||
               SENSITIVE_METHODS.contains(method);
    }

    private void logSecurityEvent(String requestPath, String method, String clientIp, 
                                 String userAgent, int statusCode, long duration) {
        
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication != null && authentication.isAuthenticated() ? 
                         authentication.getName() : "anonymous";

        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        
        log.info("[SECURITY_AUDIT] {} | {} {} | IP: {} | User: {} | Status: {} | Duration: {}ms | UA: {}",
                timestamp, method, requestPath, clientIp, username, statusCode, duration, 
                userAgent != null ? userAgent.substring(0, Math.min(userAgent.length(), 100)) : "N/A");

        // 보안 위험도가 높은 이벤트는 별도 로그
        if (isHighRiskEvent(requestPath, method, statusCode)) {
            log.warn("[SECURITY_WARNING] High risk event detected - {} {} from IP: {} by user: {}",
                    method, requestPath, clientIp, username);
        }
    }

    private boolean isHighRiskEvent(String requestPath, String method, int statusCode) {
        // 로그인 실패
        if (requestPath.contains("/auth") && method.equals("POST") && statusCode == 401) {
            return true;
        }
        
        // 코드 실행 관련 오류
        if (requestPath.contains("/execute") && statusCode >= 400) {
            return true;
        }
        
        // AI API 오류
        if (requestPath.contains("/ai/") && statusCode >= 400) {
            return true;
        }

        return false;
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty() && !"unknown".equalsIgnoreCase(xRealIp)) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
}
