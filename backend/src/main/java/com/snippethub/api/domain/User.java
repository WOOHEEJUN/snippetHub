package com.snippethub.api.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long id;

    @Column(name = "email", nullable = false, unique = true, columnDefinition = "VARCHAR(255) COLLATE utf8mb4_unicode_ci")
    private String email;

    @Column(name = "password")
    private String password;

    @Column(name = "nickname", nullable = false, unique = true, length = 50, columnDefinition = "VARCHAR(50) COLLATE utf8mb4_unicode_ci")
    private String nickname;

    @Column(name = "profile_image", length = 500)
    private String profileImage;

    @Lob
    @Column(name = "bio")
    private String bio;

    @Enumerated(EnumType.STRING)
    @Column(name = "level", length = 20)
    private UserLevel level = UserLevel.BRONZE;

    @Column(name = "points")
    private Integer points = 0;

    @Column(name = "total_posts")
    private Integer totalPosts = 0;

    @Column(name = "total_snippets")
    private Integer totalSnippets = 0;

    @Column(name = "total_comments")
    private Integer totalComments = 0;

    @Column(name = "total_likes_received")
    private Integer totalLikesReceived = 0;

    @Column(name = "total_code_executions")
    private Integer totalCodeExecutions = 0;

    @Column(name = "consecutive_login_days")
    private Integer consecutiveLoginDays = 0;

    @Column(name = "last_login_date")
    private LocalDateTime lastLoginDate;

    @Column(name = "is_verified")
    private boolean isVerified = false;

    @Column(name = "is_active")
    private boolean isActive = true;

    @Column(name = "provider", length = 20)
    private String provider; // 'kakao', 'google', 'naver', 'local' 등

    @Column(name = "provider_id", length = 100)
    private String providerId; // 소셜 서비스의 고유 ID

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    public void updateNickname(String nickname) {
        this.nickname = nickname;
    }

    public void updateBio(String bio) {
        this.bio = bio;
    }

    public void updatePassword(String password) {
        this.password = password;
    }

    public void updateLastLoginAt() {
        this.lastLoginAt = LocalDateTime.now();
    }

    public void setIsVerified(boolean isVerified) {
        this.isVerified = isVerified;
    }

    public void updateProfileImage(String profileImage) {
        this.profileImage = profileImage;
    }

    // 포인트 및 등급 관련 메서드
    public void addPoints(int points) {
        this.points = (this.points == null ? 0 : this.points) + points;
        updateLevel();
    }

    public void updateLevel() {
        UserLevel newLevel = UserLevel.getLevelByPoints(this.points);
        if (newLevel != this.level) {
            UserLevel oldLevel = this.level;
            this.level = newLevel;
            // 레벨 업 알림은 PointService에서 처리 (순환 참조 방지)
        }
    }

    // 통계 업데이트 메서드
    public void incrementTotalPosts() {
        this.totalPosts = (this.totalPosts == null ? 0 : this.totalPosts) + 1;
    }

    public void incrementTotalSnippets() {
        this.totalSnippets = (this.totalSnippets == null ? 0 : this.totalSnippets) + 1;
    }

    public void incrementTotalComments() {
        this.totalComments = (this.totalComments == null ? 0 : this.totalComments) + 1;
    }

    public void incrementTotalLikesReceived() {
        this.totalLikesReceived = (this.totalLikesReceived == null ? 0 : this.totalLikesReceived) + 1;
    }

    public void incrementTotalCodeExecutions() {
        this.totalCodeExecutions = (this.totalCodeExecutions == null ? 0 : this.totalCodeExecutions) + 1;
    }

    public void updateLoginStats() {
        LocalDateTime now = LocalDateTime.now();
        if (lastLoginDate != null) {
            // 연속 로그인 체크 (24시간 이내)
            if (lastLoginDate.plusDays(1).isAfter(now)) {
                consecutiveLoginDays++;
            } else if (lastLoginDate.plusDays(2).isBefore(now)) {
                consecutiveLoginDays = 1; // 연속 로그인 초기화
            }
        } else {
            consecutiveLoginDays = 1;
        }
        this.lastLoginDate = now;
        this.lastLoginAt = now;
    }

    public UserLevel getCurrentLevel() {
        return this.level;
    }

    public UserLevel getNextLevel() {
        return this.level.getNextLevel();
    }

    public int getPointsToNextLevel() {
        return this.level.getPointsToNextLevel(this.points == null ? 0 : this.points);
    }
    
    // Null 안전한 getter 메서드들
    public Integer getPoints() {
        return this.points == null ? 0 : this.points;
    }
    
    public Integer getTotalPosts() {
        return this.totalPosts == null ? 0 : this.totalPosts;
    }
    
    public Integer getTotalSnippets() {
        return this.totalSnippets == null ? 0 : this.totalSnippets;
    }
    
    public Integer getTotalComments() {
        return this.totalComments == null ? 0 : this.totalComments;
    }
    
    public Integer getTotalLikesReceived() {
        return this.totalLikesReceived == null ? 0 : this.totalLikesReceived;
    }
    
    public Integer getTotalCodeExecutions() {
        return this.totalCodeExecutions == null ? 0 : this.totalCodeExecutions;
    }
    
    public Integer getConsecutiveLoginDays() {
        return this.consecutiveLoginDays == null ? 0 : this.consecutiveLoginDays;
    }

    @Builder
    public User(String email, String password, String nickname, String provider, String providerId) {
        this.email = email;
        this.password = password;
        this.nickname = nickname;
        this.provider = provider;
        this.providerId = providerId;
    }
}