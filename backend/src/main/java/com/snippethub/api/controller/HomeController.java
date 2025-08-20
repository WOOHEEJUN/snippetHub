package com.snippethub.api.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.ResponseEntity;
import org.springframework.web.servlet.view.RedirectView;
import java.util.Map;

@RestController
public class HomeController {

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> home() {
        Map<String, Object> response = Map.of(
            "message", "SnippetHub API is running!",
            "version", "1.0.0",
            "status", "UP",
            "endpoints", Map.of(
                "auth", "/api/v1/auth/**",
                "snippets", "/api/v1/snippets/**",
                "posts", "/api/v1/posts/**",
                "users", "/api/v1/users/**",
                "languages", "/api/v1/languages"
            )
        );
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/api/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = Map.of(
            "status", "UP",
            "message", "SnippetHub API is healthy",
            "timestamp", System.currentTimeMillis()
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/oauth2/redirect")
    public RedirectView oauth2Redirect(
            @RequestParam(value = "accessToken", required = false) String accessToken,
            @RequestParam(value = "refreshToken", required = false) String refreshToken,
            @RequestParam(value = "user", required = false) String user) {
        
        // 파라미터가 있으면 프론트엔드로 직접 리다이렉트 (무한 루프 방지)
        if (accessToken != null && refreshToken != null && user != null) {
            // 프론트엔드의 /oauth2/callback 경로로 리다이렉트
            String frontendUrl = String.format(
                "https://snippethub.co.kr/oauth2/callback?accessToken=%s&refreshToken=%s&user=%s",
                accessToken, refreshToken, user
            );
            
            RedirectView redirectView = new RedirectView();
            redirectView.setUrl(frontendUrl);
            return redirectView;
        } else {
            // 파라미터가 없으면 홈페이지로 리다이렉트
            RedirectView redirectView = new RedirectView();
            redirectView.setUrl("https://snippethub.co.kr/");
            return redirectView;
        }
    }
} 