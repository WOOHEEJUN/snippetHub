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
    public ResponseEntity<ApiResponse<UserProfileResponseDto>> getUserProfile(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.getUserProfile(userDetails.getUsername());
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
}
