package com.snippethub.api.controller;

import com.snippethub.api.domain.Comment;
import com.snippethub.api.dto.CommentDto;
import com.snippethub.api.service.CommentService;
import com.snippethub.api.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;


@RestController
@RequestMapping("/api/v1/comments")
public class CommentController {
    private final CommentService commentService;
    private final UserService userService;

    public CommentController(CommentService commentService, UserService userService) {
        this.commentService = commentService;
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<CommentDto> createComment(@RequestBody Comment comment) {
        Comment saved = commentService.save(comment);
        return ResponseEntity.ok(toCommentDto(saved));
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long commentId) {
        Comment comment = commentService.findById(commentId);
        Long currentUserId = getCurrentUserId();
        if (!comment.getUser().getId().equals(currentUserId)) {
            return ResponseEntity.status(403).build();
        }
        commentService.delete(commentId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<CommentDto>> getAllComments() {
        return ResponseEntity.ok(commentService.findAll().stream().map(this::toCommentDto).toList());
    }

    private CommentDto toCommentDto(Comment comment) {
        CommentDto dto = new CommentDto();
        dto.setCommentId(comment.getId());
        dto.setUserId(comment.getUser() != null ? comment.getUser().getId() : null);
        dto.setPostId(comment.getPost() != null ? comment.getPost().getId() : null);
        dto.setSnippetId(comment.getSnippet() != null ? comment.getSnippet().getId() : null);
        dto.setContent(comment.getContent());
        dto.setCreatedAt(comment.getCreatedAt());
        return dto;
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        // userService를 주입받아 사용한다고 가정
        return userService.findByEmail(username).orElseThrow(() -> new RuntimeException("User not found")).getId();
    }
} 