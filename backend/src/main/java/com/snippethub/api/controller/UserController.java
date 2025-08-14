package com.snippethub.api.controller;

import com.snippethub.api.domain.Post;
import com.snippethub.api.domain.Snippet;
import com.snippethub.api.domain.User;
import com.snippethub.api.dto.ApiResponse;
import com.snippethub.api.dto.PageResponseDto;
import com.snippethub.api.dto.post.PostResponseDto;
import com.snippethub.api.dto.snippet.SnippetResponseDto;
import com.snippethub.api.dto.user.UserPasswordChangeRequestDto;
import com.snippethub.api.dto.user.UserProfileResponseDto;
import com.snippethub.api.dto.user.UserProfileResponseDto.UserStatsDto;
import com.snippethub.api.dto.user.UserProfileUpdateRequestDto;
import com.snippethub.api.service.UserService;
import com.snippethub.api.service.PointService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final PointService pointService;

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserProfileResponseDto>> getUserProfile(org.springframework.security.core.Authentication authentication) {
        System.out.println("getUserProfile 호출");
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new com.snippethub.api.exception.BusinessException(com.snippethub.api.exception.ErrorCode.LOGIN_INPUT_INVALID);
        }
        Object principal = authentication.getPrincipal();
        String email = null;
        if (principal instanceof org.springframework.security.core.userdetails.UserDetails) {
            email = ((org.springframework.security.core.userdetails.UserDetails) principal).getUsername();
        } else if (principal instanceof String) {
            email = (String) principal;
        }
        if (email == null) {
            throw new com.snippethub.api.exception.BusinessException(com.snippethub.api.exception.ErrorCode.LOGIN_INPUT_INVALID);
        }
        User user = userService.getUserProfile(email);
        UserStatsDto stats = userService.getUserStats(user.getId());
        UserProfileResponseDto responseDto = new UserProfileResponseDto(user, stats);
        return ResponseEntity.ok(ApiResponse.success(responseDto));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserProfileResponseDto>> updateUserProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UserProfileUpdateRequestDto requestDto) {

        User updatedUser = userService.updateUserProfile(userDetails.getUsername(), requestDto);
        UserStatsDto stats = userService.getUserStats(updatedUser.getId());
        UserProfileResponseDto responseDto = new UserProfileResponseDto(updatedUser, stats);
        return ResponseEntity.ok(ApiResponse.success("프로필이 성공적으로 수정되었습니다.", responseDto));
    }

    @PutMapping("/password")
    public ResponseEntity<ApiResponse<String>> changeUserPassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UserPasswordChangeRequestDto requestDto) {

        userService.changeUserPassword(userDetails.getUsername(), requestDto);
        return ResponseEntity.ok(ApiResponse.success("비밀번호가 성공적으로 변경되었습니다."));
    }

    @GetMapping("/snippets")
    public ResponseEntity<ApiResponse<PageResponseDto<SnippetResponseDto>>> getMySnippets(
            @AuthenticationPrincipal UserDetails userDetails,
            Pageable pageable,
            @RequestParam(required = false, defaultValue = "ALL") String status) {

        Page<Snippet> snippetsPage = userService.getMySnippets(userDetails.getUsername(), pageable, status);
        PageResponseDto<SnippetResponseDto> responseDto = new PageResponseDto<>(
                snippetsPage.map(SnippetResponseDto::new)
        );
        return ResponseEntity.ok(ApiResponse.success(responseDto));
    }

    /**
     * 내 등급 정보 조회
     */
    @GetMapping("/level")
    public ResponseEntity<ApiResponse<UserLevelResponseDto>> getMyLevel(
            @AuthenticationPrincipal UserDetails userDetails) {
        
        User user = userService.getUserByEmail(userDetails.getUsername());
        UserLevelResponseDto responseDto = new UserLevelResponseDto(user);
        return ResponseEntity.ok(ApiResponse.success("등급 정보를 조회했습니다.", responseDto));
    }

    /**
     * 특정 사용자의 등급 정보 조회 (공개)
     */
    @GetMapping("/{userId}/level")
    public ResponseEntity<ApiResponse<UserLevelResponseDto>> getUserLevel(@PathVariable Long userId) {
        User user = userService.getUserById(userId);
        UserLevelResponseDto responseDto = new UserLevelResponseDto(user);
        return ResponseEntity.ok(ApiResponse.success("사용자의 등급 정보를 조회했습니다.", responseDto));
    }

    /**
     * 등급별 사용자 목록 조회 (랭킹)
     */
    @GetMapping("/ranking")
    public ResponseEntity<ApiResponse<PageResponseDto<UserRankingResponseDto>>> getUserRanking(
            Pageable pageable,
            @RequestParam(required = false, defaultValue = "ALL") String level) {
        
        Page<User> usersPage = userService.getUserRanking(pageable, level);
        PageResponseDto<UserRankingResponseDto> responseDto = new PageResponseDto<>(
                usersPage.map(UserRankingResponseDto::new)
        );
        return ResponseEntity.ok(ApiResponse.success("사용자 랭킹을 조회했습니다.", responseDto));
    }

    /**
     * 등급별 통계 조회
     */
    @GetMapping("/level/stats")
    public ResponseEntity<ApiResponse<UserService.LevelStatsResponseDto>> getLevelStats() {
        UserService.LevelStatsResponseDto stats = userService.getLevelStats();
        return ResponseEntity.ok(ApiResponse.success("등급별 통계를 조회했습니다.", stats));
    }

    // DTO 클래스들
    public static class UserLevelResponseDto {
        private Long userId;
        private String nickname;
        private String currentLevel;
        private String levelEmoji;
        private String levelColor;
        private int currentPoints;
        private String nextLevel;
        private int pointsToNextLevel;
        private int totalPosts;
        private int totalSnippets;
        private int totalComments;
        private int totalLikesReceived;
        private int totalCodeExecutions;
        private int consecutiveLoginDays;

        public UserLevelResponseDto(User user) {
            this.userId = user.getId();
            this.nickname = user.getNickname();
            this.currentLevel = user.getCurrentLevel().getDisplayName();
            this.levelEmoji = user.getCurrentLevel().getEmoji();
            this.levelColor = user.getCurrentLevel().getColor();
            this.currentPoints = user.getPoints();
            this.nextLevel = user.getNextLevel().getDisplayName();
            this.pointsToNextLevel = user.getPointsToNextLevel();
            this.totalPosts = user.getTotalPosts();
            this.totalSnippets = user.getTotalSnippets();
            this.totalComments = user.getTotalComments();
            this.totalLikesReceived = user.getTotalLikesReceived();
            this.totalCodeExecutions = user.getTotalCodeExecutions();
            this.consecutiveLoginDays = user.getConsecutiveLoginDays();
        }

        // Getters
        public Long getUserId() { return userId; }
        public String getNickname() { return nickname; }
        public String getCurrentLevel() { return currentLevel; }
        public String getLevelEmoji() { return levelEmoji; }
        public String getLevelColor() { return levelColor; }
        public int getCurrentPoints() { return currentPoints; }
        public String getNextLevel() { return nextLevel; }
        public int getPointsToNextLevel() { return pointsToNextLevel; }
        public int getTotalPosts() { return totalPosts; }
        public int getTotalSnippets() { return totalSnippets; }
        public int getTotalComments() { return totalComments; }
        public int getTotalLikesReceived() { return totalLikesReceived; }
        public int getTotalCodeExecutions() { return totalCodeExecutions; }
        public int getConsecutiveLoginDays() { return consecutiveLoginDays; }
    }

    public static class UserRankingResponseDto {
        private Long userId;
        private String nickname;
        private String profileImage;
        private String currentLevel;
        private String levelEmoji;
        private int currentPoints;
        private int totalPosts;
        private int totalSnippets;
        private int totalComments;
        private int totalLikesReceived;

        public UserRankingResponseDto(User user) {
            this.userId = user.getId();
            this.nickname = user.getNickname();
            this.profileImage = user.getProfileImage();
            this.currentLevel = user.getCurrentLevel().getDisplayName();
            this.levelEmoji = user.getCurrentLevel().getEmoji();
            this.currentPoints = user.getPoints();
            this.totalPosts = user.getTotalPosts();
            this.totalSnippets = user.getTotalSnippets();
            this.totalComments = user.getTotalComments();
            this.totalLikesReceived = user.getTotalLikesReceived();
        }

        // Getters
        public Long getUserId() { return userId; }
        public String getNickname() { return nickname; }
        public String getProfileImage() { return profileImage; }
        public String getCurrentLevel() { return currentLevel; }
        public String getLevelEmoji() { return levelEmoji; }
        public int getCurrentPoints() { return currentPoints; }
        public int getTotalPosts() { return totalPosts; }
        public int getTotalSnippets() { return totalSnippets; }
        public int getTotalComments() { return totalComments; }
        public int getTotalLikesReceived() { return totalLikesReceived; }
    }



    @GetMapping("/posts")
    public ResponseEntity<ApiResponse<PageResponseDto<PostResponseDto>>> getMyPosts(
            @AuthenticationPrincipal UserDetails userDetails,
            Pageable pageable) {

        Page<Post> postsPage = userService.getMyPosts(userDetails.getUsername(), pageable);
        PageResponseDto<PostResponseDto> responseDto = new PageResponseDto<>(
                postsPage.map(PostResponseDto::new)
        );
        return ResponseEntity.ok(ApiResponse.success(responseDto));
    }

    // 다른 사용자의 프로필 조회
    @GetMapping("/{userId}/profile")
    public ResponseEntity<ApiResponse<UserProfileResponseDto>> getUserProfileById(@PathVariable Long userId) {
        User user = userService.getUserById(userId);
        UserStatsDto stats = userService.getUserStats(user.getId());
        UserProfileResponseDto responseDto = new UserProfileResponseDto(user, stats);
        return ResponseEntity.ok(ApiResponse.success(responseDto));
    }

    // 다른 사용자의 게시글 목록 조회
    @GetMapping("/{userId}/posts")
    public ResponseEntity<ApiResponse<PageResponseDto<PostResponseDto>>> getUserPosts(
            @PathVariable Long userId,
            Pageable pageable) {
        Page<Post> postsPage = userService.getUserPosts(userId, pageable);
        PageResponseDto<PostResponseDto> responseDto = new PageResponseDto<>(
                postsPage.map(PostResponseDto::new)
        );
        return ResponseEntity.ok(ApiResponse.success(responseDto));
    }

    // 다른 사용자의 스니펫 목록 조회
    @GetMapping("/{userId}/snippets")
    public ResponseEntity<ApiResponse<PageResponseDto<SnippetResponseDto>>> getUserSnippets(
            @PathVariable Long userId,
            Pageable pageable) {
        Page<Snippet> snippetsPage = userService.getUserSnippets(userId, pageable);
        PageResponseDto<SnippetResponseDto> responseDto = new PageResponseDto<>(
                snippetsPage.map(SnippetResponseDto::new)
        );
        return ResponseEntity.ok(ApiResponse.success(responseDto));
    }
}
