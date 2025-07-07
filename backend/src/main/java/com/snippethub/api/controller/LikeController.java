package com.snippethub.api.controller;

import com.snippethub.api.domain.User;
import com.snippethub.api.domain.Post;
import com.snippethub.api.domain.Snippet;
import com.snippethub.api.domain.Like;
import com.snippethub.api.service.LikeService;
import com.snippethub.api.service.UserService;
import com.snippethub.api.service.PostService;
import com.snippethub.api.service.SnippetService;
import com.snippethub.api.dto.LikeDto;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/likes")
public class LikeController {
    private final LikeService likeService;
    private final UserService userService;
    private final PostService postService;
    private final SnippetService snippetService;

    public LikeController(LikeService likeService, UserService userService, PostService postService, SnippetService snippetService) {
        this.likeService = likeService;
        this.userService = userService;
        this.postService = postService;
        this.snippetService = snippetService;
    }

    @PostMapping("/posts/{postId}")
    public ResponseEntity<?> likePost(@PathVariable Long postId) {
        User user = getCurrentUser();
        Post post = postService.getPostById(postId);
        likeService.likePost(user, post);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<?> unlikePost(@PathVariable Long postId) {
        User user = getCurrentUser();
        Post post = postService.getPostById(postId);
        if (!likeService.isPostLikedByUser(user, post)) {
            return ResponseEntity.status(403).build();
        }
        likeService.unlikePost(user, post);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/snippets/{snippetId}")
    public ResponseEntity<?> likeSnippet(@PathVariable Long snippetId) {
        User user = getCurrentUser();
        Snippet snippet = snippetService.getSnippetById(snippetId);
        likeService.likeSnippet(user, snippet);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/snippets/{snippetId}")
    public ResponseEntity<?> unlikeSnippet(@PathVariable Long snippetId) {
        User user = getCurrentUser();
        Snippet snippet = snippetService.getSnippetById(snippetId);
        if (!likeService.isSnippetLikedByUser(user, snippet)) {
            return ResponseEntity.status(403).build();
        }
        likeService.unlikeSnippet(user, snippet);
        return ResponseEntity.noContent().build();
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        return userService.findByEmail(username).orElseThrow(() -> new RuntimeException("User not found"));
    }

    private LikeDto toLikeDto(Like like) {
        LikeDto dto = new LikeDto();
        dto.setLikeId(like.getId());
        dto.setUserId(like.getUser() != null ? like.getUser().getId() : null);
        dto.setPostId(like.getPost() != null ? like.getPost().getId() : null);
        dto.setSnippetId(like.getSnippet() != null ? like.getSnippet().getId() : null);
        dto.setCreatedAt(like.getCreatedAt());
        return dto;
    }
} 