package com.snippethub.api.controller;

import com.snippethub.api.domain.UserBadge;
import com.snippethub.api.dto.ApiResponse;
import com.snippethub.api.service.BadgeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/badges")
@RequiredArgsConstructor
public class BadgeController {

    private final BadgeService badgeService;

    /**
     * 사용자의 뱃지 목록 조회
     */
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<BadgeResponseDto>>> getMyBadges(Authentication authentication) {
        Long userId = getUserIdFromAuthentication(authentication);
        List<UserBadge> userBadges = badgeService.getUserBadges(userId);
        
        List<BadgeResponseDto> badges = userBadges.stream()
                .map(this::convertToBadgeResponseDto)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(ApiResponse.success("뱃지 목록을 조회했습니다.", badges));
    }

    /**
     * 사용자의 대표 뱃지 목록 조회
     */
    @GetMapping("/my/featured")
    public ResponseEntity<ApiResponse<List<BadgeResponseDto>>> getMyFeaturedBadges(Authentication authentication) {
        Long userId = getUserIdFromAuthentication(authentication);
        List<UserBadge> userBadges = badgeService.getUserFeaturedBadges(userId);
        
        List<BadgeResponseDto> badges = userBadges.stream()
                .map(this::convertToBadgeResponseDto)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(ApiResponse.success("대표 뱃지 목록을 조회했습니다.", badges));
    }

    /**
     * 뱃지를 대표 뱃지로 설정/해제
     */
    @PostMapping("/{badgeId}/toggle-featured")
    public ResponseEntity<ApiResponse<String>> toggleFeaturedBadge(
            @PathVariable Long badgeId, 
            Authentication authentication) {
        Long userId = getUserIdFromAuthentication(authentication);
        badgeService.toggleFeaturedBadge(userId, badgeId);
        
        return ResponseEntity.ok(ApiResponse.success("대표 뱃지 설정이 변경되었습니다."));
    }

    /**
     * 사용자의 뱃지 통계 조회
     */
    @GetMapping("/my/stats")
    public ResponseEntity<ApiResponse<BadgeService.BadgeStatsDto>> getMyBadgeStats(Authentication authentication) {
        Long userId = getUserIdFromAuthentication(authentication);
        BadgeService.BadgeStatsDto stats = badgeService.getUserBadgeStats(userId);
        
        return ResponseEntity.ok(ApiResponse.success("뱃지 통계를 조회했습니다.", stats));
    }

    /**
     * 특정 사용자의 뱃지 목록 조회 (공개)
     */
    @GetMapping("/users/{userId}")
    public ResponseEntity<ApiResponse<List<BadgeResponseDto>>> getUserBadges(@PathVariable Long userId) {
        List<UserBadge> userBadges = badgeService.getUserBadges(userId);
        
        List<BadgeResponseDto> badges = userBadges.stream()
                .map(this::convertToBadgeResponseDto)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(ApiResponse.success("사용자의 뱃지 목록을 조회했습니다.", badges));
    }

    /**
     * 특정 사용자의 대표 뱃지 목록 조회 (공개)
     */
    @GetMapping("/users/{userId}/featured")
    public ResponseEntity<ApiResponse<List<BadgeResponseDto>>> getUserFeaturedBadges(@PathVariable Long userId) {
        List<UserBadge> userBadges = badgeService.getUserFeaturedBadges(userId);
        
        List<BadgeResponseDto> badges = userBadges.stream()
                .map(this::convertToBadgeResponseDto)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(ApiResponse.success("사용자의 대표 뱃지 목록을 조회했습니다.", badges));
    }

    private Long getUserIdFromAuthentication(Authentication authentication) {
        // 실제 구현에서는 UserDetails에서 userId를 추출
        // 여기서는 간단히 구현
        return 1L; // 임시 구현
    }

    private BadgeResponseDto convertToBadgeResponseDto(UserBadge userBadge) {
        return BadgeResponseDto.builder()
                .badgeId(userBadge.getBadge().getId())
                .name(userBadge.getBadge().getName())
                .description(userBadge.getBadge().getDescription())
                .icon(userBadge.getBadge().getIcon())
                .color(userBadge.getBadge().getColor())
                .category(userBadge.getBadge().getCategory().getDisplayName())
                .earnedAt(userBadge.getEarnedAt())
                .isFeatured(userBadge.isFeatured())
                .build();
    }

    // DTO 클래스
    public static class BadgeResponseDto {
        private Long badgeId;
        private String name;
        private String description;
        private String icon;
        private String color;
        private String category;
        private java.time.LocalDateTime earnedAt;
        private boolean isFeatured;

        @lombok.Builder
        public BadgeResponseDto(Long badgeId, String name, String description, String icon, 
                              String color, String category, java.time.LocalDateTime earnedAt, boolean isFeatured) {
            this.badgeId = badgeId;
            this.name = name;
            this.description = description;
            this.icon = icon;
            this.color = color;
            this.category = category;
            this.earnedAt = earnedAt;
            this.isFeatured = isFeatured;
        }

        // Getters
        public Long getBadgeId() { return badgeId; }
        public String getName() { return name; }
        public String getDescription() { return description; }
        public String getIcon() { return icon; }
        public String getColor() { return color; }
        public String getCategory() { return category; }
        public java.time.LocalDateTime getEarnedAt() { return earnedAt; }
        public boolean isFeatured() { return isFeatured; }
    }
} 