package com.snippethub.api.service;

import com.snippethub.api.domain.User;
import com.snippethub.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class PointService {

    private final UserRepository userRepository;

    // 포인트 획득 기준
    public static final int POINTS_FOR_POST = 10;           // 게시글 작성
    public static final int POINTS_FOR_SNIPPET = 15;        // 스니펫 작성
    public static final int POINTS_FOR_COMMENT = 5;         // 댓글 작성
    public static final int POINTS_FOR_LIKE_RECEIVED = 2;   // 좋아요 받음
    public static final int POINTS_FOR_CODE_EXECUTION = 1;  // 코드 실행
    public static final int POINTS_FOR_DAILY_LOGIN = 5;     // 일일 로그인
    public static final int POINTS_FOR_WEEKLY_LOGIN = 20;   // 주간 로그인 (7일 연속)
    public static final int POINTS_FOR_MONTHLY_LOGIN = 100; // 월간 로그인 (30일 연속)
    
    // 문제 해결 포인트 (난이도별)
    public static final int POINTS_FOR_EASY_PROBLEM = 10;   // 쉬운 문제 해결
    public static final int POINTS_FOR_MEDIUM_PROBLEM = 20; // 보통 문제 해결
    public static final int POINTS_FOR_HARD_PROBLEM = 30;   // 어려운 문제 해결
    public static final int POINTS_FOR_EXPERT_PROBLEM = 50; // 전문가 문제 해결

    /**
     * 게시글 작성 포인트 지급
     */
    public void awardPointsForPost(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.addPoints(POINTS_FOR_POST);
        user.incrementTotalPosts();
        userRepository.save(user);
        
        log.info("User {} earned {} points for posting", user.getNickname(), POINTS_FOR_POST);
    }

    /**
     * 스니펫 작성 포인트 지급
     */
    public void awardPointsForSnippet(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.addPoints(POINTS_FOR_SNIPPET);
        user.incrementTotalSnippets();
        userRepository.save(user);
        
        log.info("User {} earned {} points for creating snippet", user.getNickname(), POINTS_FOR_SNIPPET);
    }

    /**
     * 댓글 작성 포인트 지급
     */
    public void awardPointsForComment(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.addPoints(POINTS_FOR_COMMENT);
        user.incrementTotalComments();
        userRepository.save(user);
        
        log.info("User {} earned {} points for commenting", user.getNickname(), POINTS_FOR_COMMENT);
    }

    /**
     * 좋아요 받음 포인트 지급
     */
    public void awardPointsForLikeReceived(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.addPoints(POINTS_FOR_LIKE_RECEIVED);
        user.incrementTotalLikesReceived();
        userRepository.save(user);
        
        log.info("User {} earned {} points for receiving like", user.getNickname(), POINTS_FOR_LIKE_RECEIVED);
    }

    /**
     * 코드 실행 포인트 지급
     */
    public void awardPointsForCodeExecution(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.addPoints(POINTS_FOR_CODE_EXECUTION);
        user.incrementTotalCodeExecutions();
        userRepository.save(user);
        
        log.info("User {} earned {} points for code execution", user.getNickname(), POINTS_FOR_CODE_EXECUTION);
    }

    /**
     * 문제 해결 포인트 지급 (난이도별)
     */
    public void awardPointsForProblemSolved(Long userId, com.snippethub.api.domain.ProblemDifficulty difficulty) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        int points = switch (difficulty) {
            case EASY -> POINTS_FOR_EASY_PROBLEM;
            case MEDIUM -> POINTS_FOR_MEDIUM_PROBLEM;
            case HARD -> POINTS_FOR_HARD_PROBLEM;
            case EXPERT -> POINTS_FOR_EXPERT_PROBLEM;
        };
        
        user.addPoints(points);
        userRepository.save(user);
        
        log.info("User {} earned {} points for solving {} problem", user.getNickname(), points, difficulty.getDisplayName());
    }

    /**
     * 로그인 포인트 지급 (연속 로그인 체크 포함)
     */
    public void awardPointsForLogin(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // 기존 로그인 통계 업데이트
        user.updateLoginStats();
        
        // 일일 로그인 포인트
        user.addPoints(POINTS_FOR_DAILY_LOGIN);
        
        // 연속 로그인 보너스 포인트
        int consecutiveDays = user.getConsecutiveLoginDays();
        if (consecutiveDays == 7) {
            user.addPoints(POINTS_FOR_WEEKLY_LOGIN);
            log.info("User {} earned weekly login bonus: {} points", user.getNickname(), POINTS_FOR_WEEKLY_LOGIN);
        } else if (consecutiveDays == 30) {
            user.addPoints(POINTS_FOR_MONTHLY_LOGIN);
            log.info("User {} earned monthly login bonus: {} points", user.getNickname(), POINTS_FOR_MONTHLY_LOGIN);
        }
        
        userRepository.save(user);
        
        log.info("User {} earned {} points for daily login", user.getNickname(), POINTS_FOR_DAILY_LOGIN);
    }

    /**
     * 특별 활동 포인트 지급
     */
    public void awardSpecialPoints(Long userId, int points, String reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.addPoints(points);
        userRepository.save(user);
        
        log.info("User {} earned {} special points for: {}", user.getNickname(), points, reason);
    }

    /**
     * 포인트 차감 (벌칙 등)
     */
    public void deductPoints(Long userId, int points, String reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        int currentPoints = user.getPoints();
        int newPoints = Math.max(0, currentPoints - points); // 포인트는 0 이하로 내려가지 않음
        
        user.addPoints(newPoints - currentPoints); // 음수 값을 더해서 차감 효과
        userRepository.save(user);
        
        log.info("User {} lost {} points for: {}", user.getNickname(), points, reason);
    }

    /**
     * 사용자의 포인트 히스토리 조회 (향후 구현)
     */
    public PointHistoryDto getUserPointHistory(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        return PointHistoryDto.builder()
                .currentPoints(user.getPoints())
                .currentLevel(user.getCurrentLevel().getDisplayName())
                .nextLevel(user.getNextLevel().getDisplayName())
                .pointsToNextLevel(user.getPointsToNextLevel())
                .totalPosts(user.getTotalPosts())
                .totalSnippets(user.getTotalSnippets())
                .totalComments(user.getTotalComments())
                .totalLikesReceived(user.getTotalLikesReceived())
                .totalCodeExecutions(user.getTotalCodeExecutions())
                .consecutiveLoginDays(user.getConsecutiveLoginDays())
                .build();
    }

    // DTO 클래스
    @lombok.Builder
    public static class PointHistoryDto {
        private int currentPoints;
        private String currentLevel;
        private String nextLevel;
        private int pointsToNextLevel;
        private int totalPosts;
        private int totalSnippets;
        private int totalComments;
        private int totalLikesReceived;
        private int totalCodeExecutions;
        private int consecutiveLoginDays;

        // Getters
        public int getCurrentPoints() { return currentPoints; }
        public String getCurrentLevel() { return currentLevel; }
        public String getNextLevel() { return nextLevel; }
        public int getPointsToNextLevel() { return pointsToNextLevel; }
        public int getTotalPosts() { return totalPosts; }
        public int getTotalSnippets() { return totalSnippets; }
        public int getTotalComments() { return totalComments; }
        public int getTotalLikesReceived() { return totalLikesReceived; }
        public int getTotalCodeExecutions() { return totalCodeExecutions; }
        public int getConsecutiveLoginDays() { return consecutiveLoginDays; }
    }
} 