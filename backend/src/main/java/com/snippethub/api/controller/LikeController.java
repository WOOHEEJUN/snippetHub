package com.snippethub.api.controller;

import com.snippethub.api.dto.ApiResponse;
import com.snippethub.api.service.LikeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class LikeController {

    private final LikeService likeService;

    @PostMapping("/posts/{postId}/like")
    public ResponseEntity<ApiResponse<Boolean>> toggleLikeForPost(
            @PathVariable Long postId,
            @AuthenticationPrincipal UserDetails userDetails) {

        boolean isLiked = likeService.toggleLikeForPost(postId, userDetails.getUsername());

        String message = isLiked ? "좋아요가 추가되었습니다." : "좋아요가 취소되었습니다.";
        return ResponseEntity.ok(ApiResponse.success(message, isLiked));
    }

    @PostMapping("/snippets/{snippetId}/like")
    public ResponseEntity<ApiResponse<Boolean>> toggleLikeForSnippet(
            @PathVariable Long snippetId,
            @AuthenticationPrincipal UserDetails userDetails) {

        boolean isLiked = likeService.toggleLikeForSnippet(snippetId, userDetails.getUsername());

        String message = isLiked ? "좋아요가 추가되었습니다." : "좋아요가 취소되었습니다.";
        return ResponseEntity.ok(ApiResponse.success(message, isLiked));
    }
}