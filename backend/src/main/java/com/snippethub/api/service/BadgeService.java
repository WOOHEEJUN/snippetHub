package com.snippethub.api.service;

import com.snippethub.api.domain.*;
import com.snippethub.api.repository.BadgeRepository;
import com.snippethub.api.repository.UserBadgeRepository;
import com.snippethub.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class BadgeService {

    private final BadgeRepository badgeRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final UserRepository userRepository;

    /**
     * 사용자의 활동을 체크하고 뱃지 획득 여부를 확인
     */
    public void checkAndAwardBadges(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 창작 뱃지 체크
        checkCreationBadges(user);
        
        // 참여 뱃지 체크
        checkEngagementBadges(user);
        
        // 성취 뱃지 체크
        checkAchievementBadges(user);
        
        // 이정표 뱃지 체크
        checkMilestoneBadges(user);
        
        // 커뮤니티 뱃지 체크
        checkCommunityBadges(user);
    }

    private void checkCreationBadges(User user) {
        // 첫 게시글 작성
        if (user.getTotalPosts() == 1) {
            awardBadge(user, "FIRST_POST");
        }
        
        // 첫 스니펫 작성
        if (user.getTotalSnippets() == 1) {
            awardBadge(user, "FIRST_SNIPPET");
        }
        
        // 게시글 작성 수에 따른 뱃지
        checkCountBasedBadge(user, BadgeCategory.CREATION, "POST_WRITER", user.getTotalPosts(), 
                           new int[]{5, 10, 25, 50, 100});
        
        // 스니펫 작성 수에 따른 뱃지
        checkCountBasedBadge(user, BadgeCategory.CREATION, "SNIPPET_CREATOR", user.getTotalSnippets(), 
                           new int[]{5, 10, 25, 50, 100});
    }

    private void checkEngagementBadges(User user) {
        // 첫 댓글 작성
        if (user.getTotalComments() == 1) {
            awardBadge(user, "FIRST_COMMENT");
        }
        
        // 댓글 작성 수에 따른 뱃지
        checkCountBasedBadge(user, BadgeCategory.ENGAGEMENT, "COMMENTATOR", user.getTotalComments(), 
                           new int[]{10, 25, 50, 100, 250});
        
        // 좋아요 받은 수에 따른 뱃지
        checkCountBasedBadge(user, BadgeCategory.ENGAGEMENT, "POPULAR", user.getTotalLikesReceived(), 
                           new int[]{10, 25, 50, 100, 500});
    }

    private void checkAchievementBadges(User user) {
        // 코드 실행 수에 따른 뱃지
        checkCountBasedBadge(user, BadgeCategory.ACHIEVEMENT, "CODE_RUNNER", user.getTotalCodeExecutions(), 
                           new int[]{10, 25, 50, 100, 500});
        
        // 연속 로그인 뱃지
        checkCountBasedBadge(user, BadgeCategory.ACHIEVEMENT, "LOGIN_STREAK", user.getConsecutiveLoginDays(), 
                           new int[]{7, 30, 100, 365});
        
        // 포인트 달성 뱃지
        checkCountBasedBadge(user, BadgeCategory.ACHIEVEMENT, "POINT_COLLECTOR", user.getPoints(), 
                           new int[]{100, 500, 1000, 2500, 5000, 10000});
    }

    private void checkMilestoneBadges(User user) {
        // 등급별 이정표 뱃지
        UserLevel level = user.getCurrentLevel();
        switch (level) {
            case SILVER:
                awardBadge(user, "SILVER_ACHIEVER");
                break;
            case GOLD:
                awardBadge(user, "GOLD_ACHIEVER");
                break;
            case PLATINUM:
                awardBadge(user, "PLATINUM_ACHIEVER");
                break;
            case DIAMOND:
                awardBadge(user, "DIAMOND_ACHIEVER");
                break;
            case MASTER:
                awardBadge(user, "MASTER_ACHIEVER");
                break;
            case GRANDMASTER:
                awardBadge(user, "GRANDMASTER_ACHIEVER");
                break;
            case LEGEND:
                awardBadge(user, "LEGEND_ACHIEVER");
                break;
        }
    }

    private void checkCommunityBadges(User user) {
        // 가입 기간에 따른 뱃지 (특별 뱃지)
        long daysSinceJoin = java.time.Duration.between(user.getCreatedAt(), 
                                                       java.time.LocalDateTime.now()).toDays();
        
        if (daysSinceJoin >= 365) {
            awardBadge(user, "ONE_YEAR_MEMBER");
        }
        if (daysSinceJoin >= 30) {
            awardBadge(user, "MONTH_MEMBER");
        }
        if (daysSinceJoin >= 7) {
            awardBadge(user, "WEEK_MEMBER");
        }
    }

    private void checkCountBasedBadge(User user, BadgeCategory category, String badgePrefix, int currentCount, int[] milestones) {
        for (int milestone : milestones) {
            if (currentCount >= milestone) {
                String badgeName = badgePrefix + "_" + milestone;
                awardBadge(user, badgeName);
            }
        }
    }

    private void awardBadge(User user, String badgeName) {
        try {
            Optional<Badge> badgeOpt = badgeRepository.findFirstByName(badgeName);
            if (badgeOpt.isPresent()) {
                Badge badge = badgeOpt.get();
                
                // 이미 획득한 뱃지인지 확인
                if (!userBadgeRepository.existsByUserIdAndBadgeId(user.getId(), badge.getId())) {
                    UserBadge userBadge = UserBadge.builder()
                            .user(user)
                            .badge(badge)
                            .build();
                    
                    userBadgeRepository.save(userBadge);
                    
                    // 포인트 보상 지급
                    if (badge.getPointsReward() > 0) {
                        user.addPoints(badge.getPointsReward());
                        userRepository.save(user);
                    }
                    
                    log.info("User {} earned badge: {}", user.getNickname(), badge.getName());
                }
            }
        } catch (Exception e) {
            log.error("뱃지 지급 중 오류 발생: {}", e.getMessage());
            // 뱃지 지급 실패해도 댓글 작성은 계속 진행
        }
    }

    /**
     * 전체 뱃지 목록 조회 (모든 사용자 공통)
     */
    @Transactional(readOnly = true)
    public List<Badge> getAllBadges() {
        return badgeRepository.findAll();
    }

    /**
     * 사용자의 뱃지 목록 조회
     */
    @Transactional(readOnly = true)
    public List<UserBadge> getUserBadges(Long userId) {
        return userBadgeRepository.findByUserId(userId);
    }

    /**
     * 사용자의 대표 뱃지 목록 조회
     */
    @Transactional(readOnly = true)
    public List<UserBadge> getUserFeaturedBadges(Long userId) {
        return userBadgeRepository.findByUserIdAndIsFeaturedTrue(userId);
    }

    /**
     * 뱃지를 대표 뱃지로 설정/해제
     */
    public void toggleFeaturedBadge(Long userId, Long badgeId) {
        Optional<UserBadge> userBadgeOpt = userBadgeRepository.findByUserIdAndBadgeId(userId, badgeId);
        if (userBadgeOpt.isPresent()) {
            UserBadge userBadge = userBadgeOpt.get();
            userBadge.setFeatured(!userBadge.isFeatured());
            userBadgeRepository.save(userBadge);
        }
    }

    /**
     * 사용자의 뱃지 통계 조회
     */
    @Transactional(readOnly = true)
    public BadgeStatsDto getUserBadgeStats(Long userId) {
        long totalBadges = userBadgeRepository.countByUserId(userId);
        long creationBadges = userBadgeRepository.countByUserIdAndCategory(userId, "CREATION");
        long engagementBadges = userBadgeRepository.countByUserIdAndCategory(userId, "ENGAGEMENT");
        long achievementBadges = userBadgeRepository.countByUserIdAndCategory(userId, "ACHIEVEMENT");
        long milestoneBadges = userBadgeRepository.countByUserIdAndCategory(userId, "MILESTONE");
        long communityBadges = userBadgeRepository.countByUserIdAndCategory(userId, "COMMUNITY");
        
        return BadgeStatsDto.builder()
                .totalBadges(totalBadges)
                .creationBadges(creationBadges)
                .engagementBadges(engagementBadges)
                .achievementBadges(achievementBadges)
                .milestoneBadges(milestoneBadges)
                .communityBadges(communityBadges)
                .build();
    }

    // DTO 클래스
    @lombok.Builder
    public static class BadgeStatsDto {
        private long totalBadges;
        private long creationBadges;
        private long engagementBadges;
        private long achievementBadges;
        private long milestoneBadges;
        private long communityBadges;

        public BadgeStatsDto(long totalBadges, long creationBadges, long engagementBadges, 
                           long achievementBadges, long milestoneBadges, long communityBadges) {
            this.totalBadges = totalBadges;
            this.creationBadges = creationBadges;
            this.engagementBadges = engagementBadges;
            this.achievementBadges = achievementBadges;
            this.milestoneBadges = milestoneBadges;
            this.communityBadges = communityBadges;
        }

        // Getters
        public long getTotalBadges() { return totalBadges; }
        public long getCreationBadges() { return creationBadges; }
        public long getEngagementBadges() { return engagementBadges; }
        public long getAchievementBadges() { return achievementBadges; }
        public long getMilestoneBadges() { return milestoneBadges; }
        public long getCommunityBadges() { return communityBadges; }
    }
} 