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

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserProfileResponseDto>> getUserProfile(org.springframework.security.core.Authentication authentication) {
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
