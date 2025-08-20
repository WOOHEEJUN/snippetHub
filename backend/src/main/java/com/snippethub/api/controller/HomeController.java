package com.snippethub.api.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.ResponseEntity;
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
} 