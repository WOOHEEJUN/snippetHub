package com.snippethub.api.service;

import com.snippethub.api.domain.NotificationType;
import com.snippethub.api.domain.PointHistory;
import com.snippethub.api.domain.User;
import com.snippethub.api.domain.UserLevel;
import com.snippethub.api.repository.PointHistoryRepository;
import com.snippethub.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class PointService {

    private final UserRepository userRepository;
    private final PointHistoryRepository pointHistoryRepository;
    private final NotificationService notificationService;

    // 포인트 획득 기준
    public static final int POINTS_FOR_POST = 10;           // 게시글 작성
    public static final int POINTS_FOR_SNIPPET = 15;        // 스니펫 작성
    public static final int POINTS_FOR_COMMENT = 5;         // 댓글 작성
    public static final int POINTS_FOR_LIKE_RECEIVED = 2;   // 좋아요 받음
    public static final int POINTS_FOR_CODE_EXECUTION = 1;  // 코드 실행
    public static final int POINTS_FOR_DAILY_LOGIN = 5;     // 일일 로그인
    public static final int POINTS_FOR_WEEKLY_LOGIN = 20;   // 주간 로그인 (7일 연속)
    public static final int POINTS_FOR_MONTHLY_LOGIN = 100; // 월간 로그인 (30일 연속)
    
    // 첫 작성 보상 포인트 (10배)
    public static final int POINTS_FOR_FIRST_POST = 100;    // 첫 게시글 작성
    public static final int POINTS_FOR_FIRST_SNIPPET = 150; // 첫 스니펫 작성
    
    // 문제 해결 포인트 (난이도별)
    public static final int POINTS_FOR_EASY_PROBLEM = 10;   // 쉬운 문제 해결
    public static final int POINTS_FOR_MEDIUM_PROBLEM = 20; // 보통 문제 해결
    public static final int POINTS_FOR_HARD_PROBLEM = 30;   // 어려운 문제 해결
    public static final int POINTS_FOR_EXPERT_PROBLEM = 50; // 전문가 문제 해결

    /**
     * 게시글 작성 포인트 지급
     */
    public void awardPointsForPost(Long userId, Long postId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // 레벨 업 체크를 위한 이전 레벨 저장
        UserLevel previousLevel = user.getCurrentLevel();
        
        // 첫 게시글 작성인지 확인
        boolean isFirstPost = user.getTotalPosts() == 0;
        int pointsToAward = isFirstPost ? POINTS_FOR_FIRST_POST : POINTS_FOR_POST;
        
        user.addPoints(pointsToAward);
        user.incrementTotalPosts();
        userRepository.save(user);
        
        // 포인트 히스토리 저장
        PointHistory pointHistory = PointHistory.builder()
                .user(user)
                .pointType(isFirstPost ? PointHistory.PointType.SPECIAL_AWARD : PointHistory.PointType.POST_CREATE)
                .pointChange(pointsToAward)
                .description(isFirstPost ? "첫 게시글 작성으로 특별 보상 포인트 획득!" : "게시글 작성으로 포인트 획득")
                .relatedId(postId)
                .relatedType("POST")
                .build();
        pointHistoryRepository.save(pointHistory);
        
        // 실시간 알림 생성 (첫 게시글인 경우에만)
        if (isFirstPost) {
            notificationService.createNotification(
                user, 
                String.format("축하합니다! 첫 게시글 작성으로 %d포인트를 획득했습니다! 🎉", pointsToAward),
                NotificationType.POINT_EARNED,
                "POST",
                postId,
                null
            );
        }
        
        // 레벨 업 알림 생성
        checkAndCreateLevelUpNotification(user, previousLevel);
        
        log.info("User {} earned {} points for posting (first post: {})", user.getNickname(), pointsToAward, isFirstPost);
    }

    /**
     * 스니펫 작성 포인트 지급
     */
    public void awardPointsForSnippet(Long userId, Long snippetId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // 레벨 업 체크를 위한 이전 레벨 저장
        UserLevel previousLevel = user.getCurrentLevel();
        
        // 첫 스니펫 작성인지 확인
        boolean isFirstSnippet = user.getTotalSnippets() == 0;
        int pointsToAward = isFirstSnippet ? POINTS_FOR_FIRST_SNIPPET : POINTS_FOR_SNIPPET;
        
        user.addPoints(pointsToAward);
        user.incrementTotalSnippets();
        userRepository.save(user);
        
        // 포인트 히스토리 저장
        PointHistory pointHistory = PointHistory.builder()
                .user(user)
                .pointType(isFirstSnippet ? PointHistory.PointType.SPECIAL_AWARD : PointHistory.PointType.SNIPPET_CREATE)
                .pointChange(pointsToAward)
                .description(isFirstSnippet ? "첫 스니펫 작성으로 특별 보상 포인트 획득!" : "스니펫 작성으로 포인트 획득")
                .relatedId(snippetId)
                .relatedType("SNIPPET")
                .build();
        pointHistoryRepository.save(pointHistory);
        
        // 실시간 알림 생성 (첫 스니펫인 경우에만)
        if (isFirstSnippet) {
            notificationService.createNotification(
                user, 
                String.format("축하합니다! 첫 스니펫 작성으로 %d포인트를 획득했습니다! 🎉", pointsToAward),
                NotificationType.POINT_EARNED,
                "SNIPPET",
                snippetId,
                null
            );
        }
        
        // 레벨 업 알림 생성
        checkAndCreateLevelUpNotification(user, previousLevel);
        
        log.info("User {} earned {} points for creating snippet (first snippet: {})", user.getNickname(), pointsToAward, isFirstSnippet);
    }

    /**
     * 댓글 작성 포인트 지급
     */
    public void awardPointsForComment(Long userId, Long commentId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // 레벨 업 체크를 위한 이전 레벨 저장
        UserLevel previousLevel = user.getCurrentLevel();
        
        user.addPoints(POINTS_FOR_COMMENT);
        user.incrementTotalComments();
        userRepository.save(user);
        
        // 포인트 히스토리 저장
        PointHistory pointHistory = PointHistory.builder()
                .user(user)
                .pointType(PointHistory.PointType.COMMENT_CREATE)
                .pointChange(POINTS_FOR_COMMENT)
                .description("댓글 작성으로 포인트 획득")
                .relatedId(commentId)
                .relatedType("COMMENT")
                .build();
        pointHistoryRepository.save(pointHistory);
        
        // 레벨 업 알림 생성
        checkAndCreateLevelUpNotification(user, previousLevel);
        
        log.info("User {} earned {} points for commenting", user.getNickname(), POINTS_FOR_COMMENT);
    }

    /**
     * 좋아요 받음 포인트 지급
     */
    public void awardPointsForLikeReceived(Long userId, Long likeId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // 레벨 업 체크를 위한 이전 레벨 저장
        UserLevel previousLevel = user.getCurrentLevel();
        
        user.addPoints(POINTS_FOR_LIKE_RECEIVED);
        user.incrementTotalLikesReceived();
        userRepository.save(user);
        
        // 포인트 히스토리 저장
        PointHistory pointHistory = PointHistory.builder()
                .user(user)
                .pointType(PointHistory.PointType.LIKE_RECEIVE)
                .pointChange(POINTS_FOR_LIKE_RECEIVED)
                .description("좋아요를 받아서 포인트 획득")
                .relatedId(likeId)
                .relatedType("LIKE")
                .build();
        pointHistoryRepository.save(pointHistory);
        
        // 레벨 업 알림 생성
        checkAndCreateLevelUpNotification(user, previousLevel);
        
        log.info("User {} earned {} points for receiving like", user.getNickname(), POINTS_FOR_LIKE_RECEIVED);
    }

    /**
     * 코드 실행 포인트 지급
     */
    public void awardPointsForCodeExecution(Long userId, Long executionId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // 레벨 업 체크를 위한 이전 레벨 저장
        UserLevel previousLevel = user.getCurrentLevel();
        
        user.addPoints(POINTS_FOR_CODE_EXECUTION);
        user.incrementTotalCodeExecutions();
        userRepository.save(user);
        
        // 포인트 히스토리 저장
        PointHistory pointHistory = PointHistory.builder()
                .user(user)
                .pointType(PointHistory.PointType.CODE_EXECUTION)
                .pointChange(POINTS_FOR_CODE_EXECUTION)
                .description("코드 실행으로 포인트 획득")
                .relatedId(executionId)
                .relatedType("EXECUTION")
                .build();
        pointHistoryRepository.save(pointHistory);
        
        // 레벨 업 알림 생성
        checkAndCreateLevelUpNotification(user, previousLevel);
        
        log.info("User {} earned {} points for code execution", user.getNickname(), POINTS_FOR_CODE_EXECUTION);
    }

    /**
     * 문제 해결 포인트 지급 (난이도별)
     */
    public void awardPointsForProblemSolved(Long userId, com.snippethub.api.domain.ProblemDifficulty difficulty, Long submissionId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // 레벨 업 체크를 위한 이전 레벨 저장
        UserLevel previousLevel = user.getCurrentLevel();
        
        int points = switch (difficulty) {
            case EASY -> POINTS_FOR_EASY_PROBLEM;
            case MEDIUM -> POINTS_FOR_MEDIUM_PROBLEM;
            case HARD -> POINTS_FOR_HARD_PROBLEM;
            case EXPERT -> POINTS_FOR_EXPERT_PROBLEM;
        };
        
        user.addPoints(points);
        userRepository.save(user);
        
        // 포인트 히스토리 저장
        PointHistory pointHistory = PointHistory.builder()
                .user(user)
                .pointType(PointHistory.PointType.PROBLEM_SOLVE)
                .pointChange(points)
                .description(difficulty.getDisplayName() + " 난이도 문제 해결로 포인트 획득")
                .relatedId(submissionId)
                .relatedType("SUBMISSION")
                .build();
        pointHistoryRepository.save(pointHistory);
        
        // 레벨 업 알림 생성
        checkAndCreateLevelUpNotification(user, previousLevel);
        
        log.info("User {} earned {} points for solving {} problem", user.getNickname(), points, difficulty.getDisplayName());
    }

    /**
     * 로그인 포인트 지급 (연속 로그인 체크 포함)
     */
    public void awardPointsForLogin(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // 레벨 업 체크를 위한 이전 레벨 저장
        UserLevel previousLevel = user.getCurrentLevel();
        
        // 기존 로그인 통계 업데이트
        user.updateLoginStats();
        
        // 일일 로그인 포인트
        user.addPoints(POINTS_FOR_DAILY_LOGIN);
        
        // 포인트 히스토리 저장 (일일 로그인)
        PointHistory dailyLoginHistory = PointHistory.builder()
                .user(user)
                .pointType(PointHistory.PointType.DAILY_LOGIN)
                .pointChange(POINTS_FOR_DAILY_LOGIN)
                .description("일일 로그인으로 포인트 획득")
                .relatedId(null)
                .relatedType("LOGIN")
                .build();
        pointHistoryRepository.save(dailyLoginHistory);
        
        // 연속 로그인 보너스 포인트
        int consecutiveDays = user.getConsecutiveLoginDays();
        if (consecutiveDays == 7) {
            user.addPoints(POINTS_FOR_WEEKLY_LOGIN);
            
            // 포인트 히스토리 저장 (주간 보너스)
            PointHistory weeklyBonusHistory = PointHistory.builder()
                    .user(user)
                    .pointType(PointHistory.PointType.CONSECUTIVE_LOGIN)
                    .pointChange(POINTS_FOR_WEEKLY_LOGIN)
                    .description("7일 연속 로그인 보너스")
                    .relatedId(null)
                    .relatedType("LOGIN")
                    .build();
            pointHistoryRepository.save(weeklyBonusHistory);
            
            log.info("User {} earned weekly login bonus: {} points", user.getNickname(), POINTS_FOR_WEEKLY_LOGIN);
        } else if (consecutiveDays == 30) {
            user.addPoints(POINTS_FOR_MONTHLY_LOGIN);
            
            // 포인트 히스토리 저장 (월간 보너스)
            PointHistory monthlyBonusHistory = PointHistory.builder()
                    .user(user)
                    .pointType(PointHistory.PointType.CONSECUTIVE_LOGIN)
                    .pointChange(POINTS_FOR_MONTHLY_LOGIN)
                    .description("30일 연속 로그인 보너스")
                    .relatedId(null)
                    .relatedType("LOGIN")
                    .build();
            pointHistoryRepository.save(monthlyBonusHistory);
            
            log.info("User {} earned monthly login bonus: {} points", user.getNickname(), POINTS_FOR_MONTHLY_LOGIN);
        }
        
        userRepository.save(user);
        
        // 레벨 업 알림 생성
        checkAndCreateLevelUpNotification(user, previousLevel);
        
        log.info("User {} earned {} points for daily login", user.getNickname(), POINTS_FOR_DAILY_LOGIN);
    }

    /**
     * 특별 활동 포인트 지급
     */
    public void awardSpecialPoints(Long userId, int points, String reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // 레벨 업 체크를 위한 이전 레벨 저장
        UserLevel previousLevel = user.getCurrentLevel();
        
        user.addPoints(points);
        userRepository.save(user);
        
        // 포인트 히스토리 저장
        PointHistory pointHistory = PointHistory.builder()
                .user(user)
                .pointType(PointHistory.PointType.SPECIAL_AWARD)
                .pointChange(points)
                .description(reason)
                .relatedId(null)
                .relatedType("SPECIAL")
                .build();
        pointHistoryRepository.save(pointHistory);
        
        // 레벨 업 알림 생성
        checkAndCreateLevelUpNotification(user, previousLevel);
        
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
        int actualDeduction = currentPoints - newPoints; // 실제 차감된 포인트
        
        user.addPoints(newPoints - currentPoints); // 음수 값을 더해서 차감 효과
        userRepository.save(user);
        
        // 포인트 히스토리 저장 (차감)
        PointHistory pointHistory = PointHistory.builder()
                .user(user)
                .pointType(PointHistory.PointType.PENALTY)
                .pointChange(-actualDeduction) // 음수로 저장
                .description(reason)
                .relatedId(null)
                .relatedType("PENALTY")
                .build();
        pointHistoryRepository.save(pointHistory);
        
        log.info("User {} lost {} points for: {}", user.getNickname(), actualDeduction, reason);
    }

    /**
     * 사용자의 포인트 히스토리 조회
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

    /**
     * 사용자의 포인트 히스토리 상세 조회
     */
    public Page<PointHistory> getUserPointHistoryDetails(Long userId, Pageable pageable) {
        return pointHistoryRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    /**
     * 레벨 업 알림 생성
     */
    private void checkAndCreateLevelUpNotification(User user, UserLevel previousLevel) {
        UserLevel currentLevel = user.getCurrentLevel();
        
        // 레벨이 올라갔는지 확인
        if (currentLevel != previousLevel) {
            String message = String.format("🎉 축하합니다! %s에서 %s로 레벨업했습니다!", 
                previousLevel.getDisplayName(), currentLevel.getDisplayName());
            
            notificationService.createNotification(
                user,
                message,
                NotificationType.LEVEL_UP,
                "USER",
                user.getId(),
                null
            );
            
            log.info("User {} leveled up from {} to {}", 
                user.getNickname(), previousLevel.getDisplayName(), currentLevel.getDisplayName());
        }
    }

    /**
     * 사용자의 포인트 통계 조회
     */
    public PointStatsDto getUserPointStats(Long userId) {
        Integer totalEarned = pointHistoryRepository.getTotalEarnedPoints(userId);
        Integer totalSpent = pointHistoryRepository.getTotalSpentPoints(userId);
        List<Object[]> frequentTypes = pointHistoryRepository.getMostFrequentPointType(userId);
        
        String mostFrequentType = frequentTypes.isEmpty() ? "없음" : 
            ((PointHistory.PointType) frequentTypes.get(0)[0]).getDisplayName();
        
        return PointStatsDto.builder()
                .totalEarned(totalEarned != null ? totalEarned : 0)
                .totalSpent(totalSpent != null ? totalSpent : 0)
                .mostFrequentType(mostFrequentType)
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

    @lombok.Builder
    public static class PointStatsDto {
        private int totalEarned;
        private int totalSpent;
        private String mostFrequentType;

        // Getters
        public int getTotalEarned() { return totalEarned; }
        public int getTotalSpent() { return totalSpent; }
        public String getMostFrequentType() { return mostFrequentType; }
    }
} 