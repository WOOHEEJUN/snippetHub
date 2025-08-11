package com.snippethub.api.controller;

import com.snippethub.api.domain.PointHistory;
import com.snippethub.api.dto.ApiResponse;
import com.snippethub.api.dto.PageResponseDto;
import com.snippethub.api.service.PointService;
import com.snippethub.api.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/points")
@RequiredArgsConstructor
public class PointController {

    private final PointService pointService;
    private final UserService userService;

    /**
     * 내 포인트 정보 조회
     */
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<PointService.PointHistoryDto>> getMyPoints(Authentication authentication) {
        Long userId = getUserIdFromAuthentication(authentication);
        PointService.PointHistoryDto pointHistory = pointService.getUserPointHistory(userId);
        
        return ResponseEntity.ok(ApiResponse.success("포인트 정보를 조회했습니다.", pointHistory));
    }

    /**
     * 내 포인트 히스토리 상세 조회
     */
    @GetMapping("/my/history")
    public ResponseEntity<ApiResponse<PageResponseDto<PointHistoryResponseDto>>> getMyPointHistory(
            Authentication authentication, Pageable pageable) {
        Long userId = getUserIdFromAuthentication(authentication);
        Page<PointHistory> pointHistoryPage = pointService.getUserPointHistoryDetails(userId, pageable);
        
        PageResponseDto<PointHistoryResponseDto> responseDto = new PageResponseDto<>(
                pointHistoryPage.map(PointHistoryResponseDto::new)
        );
        
        return ResponseEntity.ok(ApiResponse.success("포인트 히스토리를 조회했습니다.", responseDto));
    }

    /**
     * 내 포인트 통계 조회
     */
    @GetMapping("/my/stats")
    public ResponseEntity<ApiResponse<PointService.PointStatsDto>> getMyPointStats(Authentication authentication) {
        Long userId = getUserIdFromAuthentication(authentication);
        PointService.PointStatsDto pointStats = pointService.getUserPointStats(userId);
        
        return ResponseEntity.ok(ApiResponse.success("포인트 통계를 조회했습니다.", pointStats));
    }

    /**
     * 특정 사용자의 포인트 정보 조회 (공개)
     */
    @GetMapping("/users/{userId}")
    public ResponseEntity<ApiResponse<PointService.PointHistoryDto>> getUserPoints(@PathVariable Long userId) {
        PointService.PointHistoryDto pointHistory = pointService.getUserPointHistory(userId);
        
        return ResponseEntity.ok(ApiResponse.success("사용자의 포인트 정보를 조회했습니다.", pointHistory));
    }

    /**
     * 포인트 획득 기준 안내
     */
    @GetMapping("/guide")
    public ResponseEntity<ApiResponse<PointGuideDto>> getPointGuide() {
        PointGuideDto guide = PointGuideDto.builder()
                .postPoints(PointService.POINTS_FOR_POST)
                .snippetPoints(PointService.POINTS_FOR_SNIPPET)
                .commentPoints(PointService.POINTS_FOR_COMMENT)
                .likeReceivedPoints(PointService.POINTS_FOR_LIKE_RECEIVED)
                .codeExecutionPoints(PointService.POINTS_FOR_CODE_EXECUTION)
                .dailyLoginPoints(PointService.POINTS_FOR_DAILY_LOGIN)
                .weeklyLoginBonus(PointService.POINTS_FOR_WEEKLY_LOGIN)
                .monthlyLoginBonus(PointService.POINTS_FOR_MONTHLY_LOGIN)
                .build();
        
        return ResponseEntity.ok(ApiResponse.success("포인트 획득 기준을 조회했습니다.", guide));
    }

    private Long getUserIdFromAuthentication(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("Authentication required");
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof org.springframework.security.core.userdetails.UserDetails) {
            String email = ((org.springframework.security.core.userdetails.UserDetails) principal).getUsername();
            return userService.getUserByEmail(email).getId();
        }
        throw new RuntimeException("Invalid authentication");
    }

    // DTO 클래스
    public static class PointHistoryResponseDto {
        private Long id;
        private String pointType;
        private String pointTypeDisplay;
        private Integer pointChange;
        private String description;
        private Long relatedId;
        private String relatedType;
        private String createdAt;

        public PointHistoryResponseDto(PointHistory pointHistory) {
            this.id = pointHistory.getId();
            this.pointType = pointHistory.getPointType().name();
            this.pointTypeDisplay = pointHistory.getPointType().getDisplayName();
            this.pointChange = pointHistory.getPointChange();
            this.description = pointHistory.getDescription();
            this.relatedId = pointHistory.getRelatedId();
            this.relatedType = pointHistory.getRelatedType();
            this.createdAt = pointHistory.getCreatedAt().toString();
        }

        // Getters
        public Long getId() { return id; }
        public String getPointType() { return pointType; }
        public String getPointTypeDisplay() { return pointTypeDisplay; }
        public Integer getPointChange() { return pointChange; }
        public String getDescription() { return description; }
        public Long getRelatedId() { return relatedId; }
        public String getRelatedType() { return relatedType; }
        public String getCreatedAt() { return createdAt; }
    }

    public static class PointGuideDto {
        private int postPoints;
        private int snippetPoints;
        private int commentPoints;
        private int likeReceivedPoints;
        private int codeExecutionPoints;
        private int dailyLoginPoints;
        private int weeklyLoginBonus;
        private int monthlyLoginBonus;

        @lombok.Builder
        public PointGuideDto(int postPoints, int snippetPoints, int commentPoints, 
                           int likeReceivedPoints, int codeExecutionPoints, int dailyLoginPoints,
                           int weeklyLoginBonus, int monthlyLoginBonus) {
            this.postPoints = postPoints;
            this.snippetPoints = snippetPoints;
            this.commentPoints = commentPoints;
            this.likeReceivedPoints = likeReceivedPoints;
            this.codeExecutionPoints = codeExecutionPoints;
            this.dailyLoginPoints = dailyLoginPoints;
            this.weeklyLoginBonus = weeklyLoginBonus;
            this.monthlyLoginBonus = monthlyLoginBonus;
        }

        // Getters
        public int getPostPoints() { return postPoints; }
        public int getSnippetPoints() { return snippetPoints; }
        public int getCommentPoints() { return commentPoints; }
        public int getLikeReceivedPoints() { return likeReceivedPoints; }
        public int getCodeExecutionPoints() { return codeExecutionPoints; }
        public int getDailyLoginPoints() { return dailyLoginPoints; }
        public int getWeeklyLoginBonus() { return weeklyLoginBonus; }
        public int getMonthlyLoginBonus() { return monthlyLoginBonus; }
    }
} 