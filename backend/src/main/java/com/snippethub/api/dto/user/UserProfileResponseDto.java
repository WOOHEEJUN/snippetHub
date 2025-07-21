package com.snippethub.api.dto.user;

import com.snippethub.api.domain.User;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class UserProfileResponseDto {
    private final Long userId;
    private final String email;
    private final String nickname;
    private final String profileImage;
    private final String bio;
    private final String level;
    private final int points;
    private final LocalDateTime joinDate;
    private final LocalDateTime lastLoginAt;
    private final UserStatsDto stats;

    public UserProfileResponseDto(User user, UserStatsDto stats) {
        this.userId = user.getId();
        this.email = user.getEmail();
        this.nickname = user.getNickname();
        this.profileImage = user.getProfileImage();
        this.bio = user.getBio();
        this.level = user.getLevel();
        this.points = user.getPoints();
        this.joinDate = user.getCreatedAt();
        this.lastLoginAt = user.getLastLoginAt();
        this.stats = stats;
    }

    @Getter
    public static class UserStatsDto {
        private final long totalSnippets;
        private final long totalPosts;
        private final long totalComments;
        private final long totalLikes;
        private final long totalViews;

        public UserStatsDto(long totalSnippets, long totalPosts, long totalComments, long totalLikes, long totalViews) {
            this.totalSnippets = totalSnippets;
            this.totalPosts = totalPosts;
            this.totalComments = totalComments;
            this.totalLikes = totalLikes;
            this.totalViews = totalViews;
        }
    }
}
