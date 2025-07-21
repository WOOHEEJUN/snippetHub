package com.snippethub.api.controller;

import com.snippethub.api.domain.Comment;
import com.snippethub.api.dto.ApiResponse;
import com.snippethub.api.dto.comment.CommentCreateRequestDto;
import com.snippethub.api.dto.comment.CommentResponseDto;
import com.snippethub.api.dto.comment.CommentUpdateRequestDto;
import com.snippethub.api.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @PostMapping("/api/posts/{postId}/comments")
    public ResponseEntity<ApiResponse<CommentResponseDto>> createCommentForPost(
            @PathVariable Long postId,
            @Valid @RequestBody CommentCreateRequestDto requestDto,
            @AuthenticationPrincipal UserDetails userDetails) {

        Comment newComment = commentService.createCommentForPost(postId, requestDto, userDetails.getUsername());
        CommentResponseDto responseDto = new CommentResponseDto(newComment);

        return new ResponseEntity<>(ApiResponse.success("댓글이 성공적으로 작성되었습니다.", responseDto), HttpStatus.CREATED);
    }

    @PostMapping("/api/snippets/{snippetId}/comments")
    public ResponseEntity<ApiResponse<CommentResponseDto>> createCommentForSnippet(
            @PathVariable Long snippetId,
            @Valid @RequestBody CommentCreateRequestDto requestDto,
            @AuthenticationPrincipal UserDetails userDetails) {

        Comment newComment = commentService.createCommentForSnippet(snippetId, requestDto, userDetails.getUsername());
        CommentResponseDto responseDto = new CommentResponseDto(newComment);

        return new ResponseEntity<>(ApiResponse.success("댓글이 성공적으로 작성되었습니다.", responseDto), HttpStatus.CREATED);
    }

    @GetMapping("/api/posts/{postId}/comments")
    public ResponseEntity<ApiResponse<List<CommentResponseDto>>> getCommentsForPost(@PathVariable Long postId) {
        List<Comment> comments = commentService.getCommentsForPost(postId);
        List<CommentResponseDto> responseDtos = comments.stream()
                .map(CommentResponseDto::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(responseDtos));
    }

    @GetMapping("/api/snippets/{snippetId}/comments")
    public ResponseEntity<ApiResponse<List<CommentResponseDto>>> getCommentsForSnippet(@PathVariable Long snippetId) {
        List<Comment> comments = commentService.getCommentsForSnippet(snippetId);
        List<CommentResponseDto> responseDtos = comments.stream()
                .map(CommentResponseDto::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(responseDtos));
    }

    @PutMapping("/api/comments/{commentId}")
    public ResponseEntity<ApiResponse<CommentResponseDto>> updateComment(
            @PathVariable Long commentId,
            @Valid @RequestBody CommentUpdateRequestDto requestDto,
            @AuthenticationPrincipal UserDetails userDetails) {

        Comment updatedComment = commentService.updateComment(commentId, requestDto, userDetails.getUsername());
        CommentResponseDto responseDto = new CommentResponseDto(updatedComment);
        return ResponseEntity.ok(ApiResponse.success("댓글이 성공적으로 수정되었습니다.", responseDto));
    }

    @DeleteMapping("/api/comments/{commentId}")
    public ResponseEntity<ApiResponse<String>> deleteComment(
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserDetails userDetails) {

        commentService.deleteComment(commentId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("댓글이 성공적으로 삭제되었습니다."));
    }
}
