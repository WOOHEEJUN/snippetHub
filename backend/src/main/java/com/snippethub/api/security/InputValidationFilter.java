package com.snippethub.api.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Pattern;

@Component
@Slf4j
public class InputValidationFilter extends OncePerRequestFilter {

    @Value("${security.input.validation.enabled:true}")
    private boolean inputValidationEnabled;

    // SQL Injection 패턴
    private static final List<Pattern> SQL_INJECTION_PATTERNS = Arrays.asList(
        Pattern.compile("(?i)(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|OR|AND)"),
        Pattern.compile("(?i)(--|;|'|\"|/\\*|\\*/)"),
        Pattern.compile("(?i)(xp_cmdshell|sp_executesql|EXECUTE)")
    );

    // XSS 패턴
    private static final List<Pattern> XSS_PATTERNS = Arrays.asList(
        Pattern.compile("(?i)(<script|javascript:|vbscript:|onload=|onerror=|onclick=)"),
        Pattern.compile("(?i)(<iframe|<object|<embed|<form)"),
        Pattern.compile("(?i)(document\\.|window\\.|eval\\(|alert\\()")
    );

    // Path Traversal 패턴
    private static final List<Pattern> PATH_TRAVERSAL_PATTERNS = Arrays.asList(
        Pattern.compile("(?i)(\\.\\./|\\.\\.\\\\|%2e%2e%2f|%2e%2e%5c)"),
        Pattern.compile("(?i)(/etc/|/var/|/tmp/|/home/|/root/)")
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        if (!inputValidationEnabled) {
            filterChain.doFilter(request, response);
            return;
        }

        // URL 경로 검증
        if (containsMaliciousPattern(request.getRequestURI(), PATH_TRAVERSAL_PATTERNS)) {
            log.warn("Path traversal attempt detected in URL: {}", request.getRequestURI());
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().write("{\"error\":\"Invalid request path\"}");
            return;
        }

        // Query 파라미터 검증
        String queryString = request.getQueryString();
        if (queryString != null) {
            if (containsMaliciousPattern(queryString, SQL_INJECTION_PATTERNS) ||
                containsMaliciousPattern(queryString, XSS_PATTERNS)) {
                log.warn("Malicious pattern detected in query string: {}", queryString);
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"error\":\"Invalid query parameters\"}");
                return;
            }
        }

        // 헤더 검증
        if (containsMaliciousHeaders(request)) {
            log.warn("Malicious headers detected from IP: {}", getClientIpAddress(request));
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().write("{\"error\":\"Invalid headers\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean containsMaliciousPattern(String input, List<Pattern> patterns) {
        if (input == null) return false;
        
        return patterns.stream().anyMatch(pattern -> pattern.matcher(input).find());
    }

    private boolean containsMaliciousHeaders(HttpServletRequest request) {
        // Host 헤더 검증
        String host = request.getHeader("Host");
        if (host != null && !isValidHost(host)) {
            return true;
        }

        // User-Agent 검증
        String userAgent = request.getHeader("User-Agent");
        if (userAgent != null && containsMaliciousPattern(userAgent, XSS_PATTERNS)) {
            return true;
        }

        // Referer 검증
        String referer = request.getHeader("Referer");
        if (referer != null && containsMaliciousPattern(referer, XSS_PATTERNS)) {
            return true;
        }

        return false;
    }

    private boolean isValidHost(String host) {
        if (host == null) return false;
        
        // 허용된 도메인들
        List<String> allowedHosts = Arrays.asList(
            "snippethub.co.kr",
            "snippethub-frontend.s3-website.ap-northeast-2.amazonaws.com",
            "localhost:8080",
            "localhost:3000"
        );
        
        return allowedHosts.stream().anyMatch(host::contains);
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
