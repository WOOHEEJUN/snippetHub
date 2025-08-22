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
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.regex.Pattern;

@Component
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

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

    private final ConcurrentHashMap<String, RateLimitInfo> rateLimitMap = new ConcurrentHashMap<>();
    
    // IP 주소 검증을 위한 정규식 패턴
    private static final Pattern IPV4_PATTERN = Pattern.compile(
        "^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"
    );
    
    private static final Pattern IPV6_PATTERN = Pattern.compile(
        "^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$"
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        if (!rateLimitingEnabled) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = getSecureClientIpAddress(request);
        String requestPath = request.getRequestURI();
        String method = request.getMethod();
        String userAgent = request.getHeader("User-Agent");

        // IP 주소 유효성 검증
        if (!isValidIpAddress(clientIp)) {
            log.warn("Invalid IP address detected: {}", clientIp);
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Invalid request origin.\"}");
            return;
        }

        // User-Agent 검증
        if (!isValidUserAgent(userAgent)) {
            log.warn("Suspicious User-Agent detected: {} from IP: {}", userAgent, clientIp);
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Invalid request.\"}");
            return;
        }

        // Rate limiting 적용
        if (!isAllowed(clientIp, requestPath, method)) {
            log.warn("Rate limit exceeded for IP: {}, Path: {}, Method: {}", clientIp, requestPath, method);
            response.setStatus(HttpServletResponse.SC_TOO_MANY_REQUESTS);
            response.setContentType("application/json");
            response.setHeader("Retry-After", String.valueOf(getRetryAfterSeconds(requestPath)));
            response.getWriter().write("{\"error\":\"Rate limit exceeded. Please try again later.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isAllowed(String clientIp, String requestPath, String method) {
        String key = generateRateLimitKey(clientIp, requestPath, method);
        RateLimitInfo info = rateLimitMap.get(key);
        
        long currentTime = System.currentTimeMillis();
        
        if (info == null || currentTime - info.getWindowStart() > getWindowMs(requestPath)) {
            // 새로운 윈도우 시작
            int limit = getLimit(requestPath);
            info = new RateLimitInfo(currentTime, new AtomicInteger(limit));
            rateLimitMap.put(key, info);
        }
        
        return info.decrementAndGet() >= 0;
    }

    private String generateRateLimitKey(String clientIp, String requestPath, String method) {
        // IP + 경로 + 메서드 조합으로 키 생성
        return clientIp + ":" + requestPath + ":" + method;
    }

    private int getLimit(String requestPath) {
        if (requestPath.startsWith("/api/ai/")) {
            return aiApiLimit;
        } else if (requestPath.startsWith("/api/v1/execute") || requestPath.startsWith("/api/execute")) {
            return codeExecutionLimit;
        } else if (requestPath.startsWith("/api/auth/")) {
            return authLimit;
        } else {
            return defaultLimit;
        }
    }

    private long getWindowMs(String requestPath) {
        int windowSeconds;
        if (requestPath.startsWith("/api/ai/")) {
            windowSeconds = aiApiWindow;
        } else if (requestPath.startsWith("/api/v1/execute") || requestPath.startsWith("/api/execute")) {
            windowSeconds = codeExecutionWindow;
        } else if (requestPath.startsWith("/api/auth/")) {
            windowSeconds = authWindow;
        } else {
            windowSeconds = defaultWindow;
        }
        return windowSeconds * 1000L;
    }

    private int getRetryAfterSeconds(String requestPath) {
        // 경로별로 다른 재시도 시간 설정
        if (requestPath.startsWith("/api/ai/")) {
            return aiApiWindow;
        } else if (requestPath.startsWith("/api/v1/execute") || requestPath.startsWith("/api/execute")) {
            return codeExecutionWindow;
        } else if (requestPath.startsWith("/api/auth/")) {
            return authWindow;
        } else {
            return defaultWindow;
        }
    }

    /**
     * 보안 강화된 클라이언트 IP 주소 추출
     */
    private String getSecureClientIpAddress(HttpServletRequest request) {
        // 신뢰할 수 있는 프록시 헤더들 (순서대로 확인)
        String[] headerNames = {
            "X-Forwarded-For",
            "X-Real-IP", 
            "X-Client-IP",
            "CF-Connecting-IP", // Cloudflare
            "True-Client-IP",   // Akamai
            "X-Cluster-Client-IP"
        };
        
        for (String headerName : headerNames) {
            String headerValue = request.getHeader(headerName);
            if (headerValue != null && !headerValue.trim().isEmpty()) {
                // 쉼표로 구분된 여러 IP 중 첫 번째 IP 사용
                String firstIp = headerValue.split(",")[0].trim();
                if (isValidIpAddress(firstIp)) {
                    return firstIp;
                }
            }
        }
        
        // 헤더에서 유효한 IP를 찾지 못한 경우 직접 IP 사용
        return request.getRemoteAddr();
    }

    /**
     * IP 주소 유효성 검증
     */
    private boolean isValidIpAddress(String ip) {
        if (ip == null || ip.trim().isEmpty()) {
            return false;
        }
        
        ip = ip.trim();
        
        // IPv4 검증
        if (IPV4_PATTERN.matcher(ip).matches()) {
            // 특정 IP 범위 차단 (내부 네트워크, 루프백 등)
            if (ip.startsWith("127.") || ip.startsWith("10.") || 
                ip.startsWith("192.168.") || ip.startsWith("172.")) {
                return false;
            }
            return true;
        }
        
        // IPv6 검증
        if (IPV6_PATTERN.matcher(ip).matches()) {
            // IPv6 루프백 및 내부 주소 차단
            if (ip.equals("::1") || ip.equals("::") || 
                ip.startsWith("fe80:") || ip.startsWith("fc00:") || ip.startsWith("fd00:")) {
                return false;
            }
            return true;
        }
        
        return false;
    }

    /**
     * User-Agent 유효성 검증
     */
    private boolean isValidUserAgent(String userAgent) {
        if (userAgent == null || userAgent.trim().isEmpty()) {
            return false;
        }
        
        userAgent = userAgent.toLowerCase();
        
        // 봇/크롤러 차단
        String[] botPatterns = {
            "bot", "crawler", "spider", "scraper", "curl", "wget", "python", "java", "perl",
            "ruby", "php", "go-http-client", "okhttp", "apache-httpclient", "postman",
            "insomnia", "thunder client", "httpie", "ab", "siege", "jmeter", "loadrunner"
        };
        
        for (String pattern : botPatterns) {
            if (userAgent.contains(pattern)) {
                return false;
            }
        }
        
        // 일반적인 브라우저 User-Agent 패턴 확인
        String[] validPatterns = {
            "mozilla", "chrome", "safari", "firefox", "edge", "opera", "ie", "webkit", "gecko"
        };
        
        boolean hasValidPattern = false;
        for (String pattern : validPatterns) {
            if (userAgent.contains(pattern)) {
                hasValidPattern = true;
                break;
            }
        }
        
        return hasValidPattern;
    }

    private static class RateLimitInfo {
        private final long windowStart;
        private final AtomicInteger remainingTokens;

        public RateLimitInfo(long windowStart, AtomicInteger remainingTokens) {
            this.windowStart = windowStart;
            this.remainingTokens = remainingTokens;
        }

        public long getWindowStart() {
            return windowStart;
        }

        public int decrementAndGet() {
            return remainingTokens.decrementAndGet();
        }
    }
}
