package com.snippethub.api.controller;

import com.snippethub.api.dto.CommentDto;
import com.snippethub.api.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    // 게시글에 댓글 생성
    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<CommentDto.CommentResponseDto> createPostComment(
            @PathVariable Long postId,
            @RequestBody CommentDto.CommentRequestDto requestDto,
            @AuthenticationPrincipal UserDetails userDetails) {
        CommentDto.CommentResponseDto comment = commentService.createPostComment(postId, requestDto, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(comment);
    }

    // 스니펫에 댓글 생성
    @PostMapping("/snippets/{snippetId}/comments")
    public ResponseEntity<CommentDto.CommentResponseDto> createSnippetComment(
            @PathVariable Long snippetId,
            @RequestBody CommentDto.CommentRequestDto requestDto,
            @AuthenticationPrincipal UserDetails userDetails) {
        CommentDto.CommentResponseDto comment = commentService.createSnippetComment(snippetId, requestDto, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(comment);
    }

    // 댓글 수정
    @PutMapping("/comments/{commentId}")
    public ResponseEntity<CommentDto.CommentResponseDto> updateComment(
            @PathVariable Long commentId,
            @RequestBody CommentDto.CommentRequestDto requestDto,
            @AuthenticationPrincipal UserDetails userDetails) {
        CommentDto.CommentResponseDto updatedComment = commentService.updateComment(commentId, requestDto, userDetails.getUsername());
        return ResponseEntity.ok(updatedComment);
    }

    // 댓글 삭제
    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserDetails userDetails) {
        commentService.deleteComment(commentId, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    // 게시글의 댓글 목록 조회 (페이징)
    @GetMapping("/posts/{postId}/comments")
    public ResponseEntity<Page<CommentDto.CommentResponseDto>> getPostComments(
            @PathVariable Long postId,
            Pageable pageable) {
        Page<CommentDto.CommentResponseDto> comments = commentService.getPostComments(postId, pageable);
        return ResponseEntity.ok(comments);
    }

    // 스니펫의 댓글 목록 조회 (페이징)
    @GetMapping("/snippets/{snippetId}/comments")
    public ResponseEntity<Page<CommentDto.CommentResponseDto>> getSnippetComments(
            @PathVariable Long snippetId,
            Pageable pageable) {
        Page<CommentDto.CommentResponseDto> comments = commentService.getSnippetComments(snippetId, pageable);
        return ResponseEntity.ok(comments);
    }

    // 게시글의 모든 댓글 목록 조회 (페이징 없음)
    @GetMapping("/posts/{postId}/comments/all")
    public ResponseEntity<List<CommentDto.CommentResponseDto>> getAllPostComments(
            @PathVariable Long postId) {
        List<CommentDto.CommentResponseDto> comments = commentService.getAllPostComments(postId);
        return ResponseEntity.ok(comments);
    }

    // 스니펫의 모든 댓글 목록 조회 (페이징 없음)
    @GetMapping("/snippets/{snippetId}/comments/all")
    public ResponseEntity<List<CommentDto.CommentResponseDto>> getAllSnippetComments(
            @PathVariable Long snippetId) {
        List<CommentDto.CommentResponseDto> comments = commentService.getAllSnippetComments(snippetId);
        return ResponseEntity.ok(comments);
    }

    // 특정 댓글의 대댓글 목록 조회
    @GetMapping("/comments/{commentId}/replies")
    public ResponseEntity<List<CommentDto.CommentResponseDto>> getRepliesByCommentId(
            @PathVariable Long commentId) {
        List<CommentDto.CommentResponseDto> replies = commentService.getRepliesByCommentId(commentId);
        return ResponseEntity.ok(replies);
    }


}

// 프론트엔드 호환성을 위한 추가 컨트롤러
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
class CommentControllerV2 {

    private final CommentService commentService;

    // 게시글에 댓글 생성 (프론트엔드 호환성)
    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<CommentDto.CommentResponseDto> createPostComment(
            @PathVariable Long postId,
            @RequestBody CommentDto.CommentRequestDto requestDto,
            @AuthenticationPrincipal UserDetails userDetails) {
        CommentDto.CommentResponseDto comment = commentService.createPostComment(postId, requestDto, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(comment);
    }

    // 스니펫에 댓글 생성 (프론트엔드 호환성)
    @PostMapping("/snippets/{snippetId}/comments")
    public ResponseEntity<CommentDto.CommentResponseDto> createSnippetComment(
            @PathVariable Long snippetId,
            @RequestBody CommentDto.CommentRequestDto requestDto,
            @AuthenticationPrincipal UserDetails userDetails) {
        CommentDto.CommentResponseDto comment = commentService.createSnippetComment(snippetId, requestDto, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(comment);
    }

    // 댓글 수정 (프론트엔드 호환성)
    @PutMapping("/comments/{commentId}")
    public ResponseEntity<CommentDto.CommentResponseDto> updateComment(
            @PathVariable Long commentId,
            @RequestBody CommentDto.CommentRequestDto requestDto,
            @AuthenticationPrincipal UserDetails userDetails) {
        CommentDto.CommentResponseDto updatedComment = commentService.updateComment(commentId, requestDto, userDetails.getUsername());
        return ResponseEntity.ok(updatedComment);
    }

    // 댓글 삭제 (프론트엔드 호환성)
    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserDetails userDetails) {
        commentService.deleteComment(commentId, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    // 게시글의 댓글 목록 조회 (프론트엔드 호환성)
    @GetMapping("/posts/{postId}/comments")
    public ResponseEntity<Page<CommentDto.CommentResponseDto>> getPostComments(
            @PathVariable Long postId,
            Pageable pageable) {
        Page<CommentDto.CommentResponseDto> comments = commentService.getPostComments(postId, pageable);
        return ResponseEntity.ok(comments);
    }

    // 스니펫의 댓글 목록 조회 (프론트엔드 호환성)
    @GetMapping("/snippets/{snippetId}/comments")
    public ResponseEntity<Page<CommentDto.CommentResponseDto>> getSnippetComments(
            @PathVariable Long snippetId,
            Pageable pageable) {
        Page<CommentDto.CommentResponseDto> comments = commentService.getSnippetComments(snippetId, pageable);
        return ResponseEntity.ok(comments);
    }

    // 게시글의 모든 댓글 목록 조회 (프론트엔드 호환성, 페이징 없음)
    @GetMapping("/posts/{postId}/comments/all")
    public ResponseEntity<List<CommentDto.CommentResponseDto>> getAllPostComments(
            @PathVariable Long postId) {
        List<CommentDto.CommentResponseDto> comments = commentService.getAllPostComments(postId);
        return ResponseEntity.ok(comments);
    }

    // 스니펫의 모든 댓글 목록 조회 (프론트엔드 호환성, 페이징 없음)
    @GetMapping("/snippets/{snippetId}/comments/all")
    public ResponseEntity<List<CommentDto.CommentResponseDto>> getAllSnippetComments(
            @PathVariable Long snippetId) {
        List<CommentDto.CommentResponseDto> comments = commentService.getAllSnippetComments(snippetId);
        return ResponseEntity.ok(comments);
    }

    // 특정 댓글의 대댓글 목록 조회 (프론트엔드 호환성)
    @GetMapping("/comments/{commentId}/replies")
    public ResponseEntity<List<CommentDto.CommentResponseDto>> getRepliesByCommentId(
            @PathVariable Long commentId) {
        List<CommentDto.CommentResponseDto> replies = commentService.getRepliesByCommentId(commentId);
        return ResponseEntity.ok(replies);
    }


}