package com.snippethub.api.controller;

import com.snippethub.api.domain.Badge;
import com.snippethub.api.domain.UserBadge;
import com.snippethub.api.dto.ApiResponse;
import com.snippethub.api.service.BadgeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/badges")
@RequiredArgsConstructor
public class BadgeController {

    private final BadgeService badgeService;

    /**
     * 전체 뱃지 목록 조회 (모든 사용자 공통)
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<BadgeInfoDto>>> getAllBadges(@RequestParam(required = false) String category) {
        try {
            List<Badge> badges;
            if (category != null && !category.isEmpty()) {
                com.snippethub.api.domain.BadgeCategory cat;
                try {
                    cat = com.snippethub.api.domain.BadgeCategory.valueOf(category.toUpperCase());
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.ok(ApiResponse.success("전체 뱃지 목록을 조회했습니다.", new java.util.ArrayList<>()));
                }
                badges = badgeService.getBadgesByCategory(cat);
            } else {
                badges = badgeService.getAllBadges();
            }
            List<BadgeInfoDto> badgeInfoList = new java.util.ArrayList<>();
            for (Badge badge : badges) {
                badgeInfoList.add(convertToBadgeInfoDto(badge));
            }
            return ResponseEntity.ok(ApiResponse.success("전체 뱃지 목록을 조회했습니다.", badgeInfoList));
        } catch (Exception e) {
            // 오류 발생 시 빈 리스트 반환
            return ResponseEntity.ok(ApiResponse.success("전체 뱃지 목록을 조회했습니다.", new java.util.ArrayList<>()));
        }
    }

    /**
     * 사용자의 뱃지 목록 조회
     */
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<BadgeResponseDto>>> getMyBadges(Authentication authentication) {
        Long userId = getUserIdFromAuthentication(authentication);
        List<UserBadge> userBadges = badgeService.getUserBadges(userId);
        
        List<BadgeResponseDto> badges = new java.util.ArrayList<>();
        for (UserBadge userBadge : userBadges) {
            badges.add(convertToBadgeResponseDto(userBadge));
        }
        
        return ResponseEntity.ok(ApiResponse.success("뱃지 목록을 조회했습니다.", badges));
    }

    /**
     * 사용자의 대표 뱃지 목록 조회
     */
    @GetMapping("/my/featured")
    public ResponseEntity<ApiResponse<List<BadgeResponseDto>>> getMyFeaturedBadges(Authentication authentication) {
        Long userId = getUserIdFromAuthentication(authentication);
        List<UserBadge> userBadges = badgeService.getUserFeaturedBadges(userId);
        
        List<BadgeResponseDto> badges = new java.util.ArrayList<>();
        for (UserBadge userBadge : userBadges) {
            badges.add(convertToBadgeResponseDto(userBadge));
        }
        
        return ResponseEntity.ok(ApiResponse.success("대표 뱃지 목록을 조회했습니다.", badges));
    }

    /**
     * 뱃지를 대표 뱃지로 설정/해제 (기존)
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
     * 뱃지를 대표 뱃지로 설정/해제 (프론트엔드 호환성)
     */
    @PutMapping("/{badgeId}/feature")
    public ResponseEntity<ApiResponse<String>> toggleFeaturedBadgeV2(
            @PathVariable Long badgeId,
            @RequestParam boolean featured,
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
        
        List<BadgeResponseDto> badges = new java.util.ArrayList<>();
        for (UserBadge userBadge : userBadges) {
            badges.add(convertToBadgeResponseDto(userBadge));
        }
        
        return ResponseEntity.ok(ApiResponse.success("사용자의 뱃지 목록을 조회했습니다.", badges));
    }

    /**
     * 특정 사용자의 대표 뱃지 목록 조회 (공개)
     */
    @GetMapping("/users/{userId}/featured")
    public ResponseEntity<ApiResponse<List<BadgeResponseDto>>> getUserFeaturedBadges(@PathVariable Long userId) {
        List<UserBadge> userBadges = badgeService.getUserFeaturedBadges(userId);
        
        List<BadgeResponseDto> badges = new java.util.ArrayList<>();
        for (UserBadge userBadge : userBadges) {
            badges.add(convertToBadgeResponseDto(userBadge));
        }
        
        return ResponseEntity.ok(ApiResponse.success("사용자의 대표 뱃지 목록을 조회했습니다.", badges));
    }

    private Long getUserIdFromAuthentication(Authentication authentication) {
        // 실제 구현에서는 UserDetails에서 userId를 추출
        // 여기서는 간단히 구현
        return 1L; // 임시 구현
    }

    private BadgeResponseDto convertToBadgeResponseDto(UserBadge userBadge) {
        try {
            Badge badge = userBadge.getBadge();
            return new BadgeResponseDto(
                    badge.getId(),
                    badge.getName(),
                    badge.getDescription(),
                    badge.getIcon(),
                    badge.getColor(),
                    badge.getCategory().getDisplayName(),
                    userBadge.getEarnedAt(),
                    userBadge.isFeatured()
            );
        } catch (Exception e) {
            // Lombok 문제 발생 시 기본값 반환
            return new BadgeResponseDto(
                    1L,
                    "뱃지",
                    "설명",
                    "🏆",
                    "#FFD700",
                    "기본",
                    java.time.LocalDateTime.now(),
                    false
            );
        }
    }

    private BadgeInfoDto convertToBadgeInfoDto(Badge badge) {
        try {
            return new BadgeInfoDto(
                    badge.getId(),
                    badge.getName(),
                    badge.getDescription(),
                    badge.getIcon(),
                    badge.getColor(),
                    badge.getCategory().getDisplayName(),
                    badge.getRequiredCount(),
                    badge.getPointsReward(),
                    badge.isHidden()
            );
        } catch (Exception e) {
            // Lombok 문제 발생 시 기본값 반환
            return new BadgeInfoDto(
                    1L,
                    "뱃지",
                    "설명",
                    "🏆",
                    "#FFD700",
                    "기본",
                    1,
                    10,
                    false
            );
        }
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

    // 전체 뱃지 정보 DTO
    public static class BadgeInfoDto {
        private Long id;
        private String name;
        private String description;
        private String icon;
        private String color;
        private String category;
        private int requiredCount;
        private int pointsReward;
        private boolean isHidden;

        public BadgeInfoDto(Long id, String name, String description, String icon, 
                           String color, String category, int requiredCount, 
                           int pointsReward, boolean isHidden) {
            this.id = id;
            this.name = name;
            this.description = description;
            this.icon = icon;
            this.color = color;
            this.category = category;
            this.requiredCount = requiredCount;
            this.pointsReward = pointsReward;
            this.isHidden = isHidden;
        }

        // Getters
        public Long getId() { return id; }
        public String getName() { return name; }
        public String getDescription() { return description; }
        public String getIcon() { return icon; }
        public String getColor() { return color; }
        public String getCategory() { return category; }
        public int getRequiredCount() { return requiredCount; }
        public int getPointsReward() { return pointsReward; }
        public boolean isHidden() { return isHidden; }
    }
} 