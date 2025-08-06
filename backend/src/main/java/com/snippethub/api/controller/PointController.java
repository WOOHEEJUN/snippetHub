package com.snippethub.api.controller;

import com.snippethub.api.dto.ApiResponse;
import com.snippethub.api.service.PointService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/points")
@RequiredArgsConstructor
public class PointController {

    private final PointService pointService;

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
        // 실제 구현에서는 UserDetails에서 userId를 추출
        // 여기서는 간단히 구현
        return 1L; // 임시 구현
    }

    // DTO 클래스
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