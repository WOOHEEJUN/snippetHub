package com.snippethub.api.service;

import com.snippethub.api.domain.Comment;
import com.snippethub.api.domain.Post;
import com.snippethub.api.domain.Snippet;
import com.snippethub.api.domain.User;
import com.snippethub.api.dto.CommentDto;
import com.snippethub.api.repository.CommentRepository;
import com.snippethub.api.repository.PostRepository;
import com.snippethub.api.repository.SnippetRepository;
import com.snippethub.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class CommentService {

    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final SnippetRepository snippetRepository;
    private final NotificationService notificationService; // 알림 서비스 주입
    private final PointService pointService;
    private final BadgeService badgeService;

    // 게시글에 댓글 생성
    public CommentDto.CommentResponseDto createPostComment(Long postId, CommentDto.CommentRequestDto requestDto, String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElseThrow(() -> new IllegalArgumentException("User not found"));
        Post post = postRepository.findById(postId).orElseThrow(() -> new IllegalArgumentException("Post not found"));

        Comment parentComment = null;
        Integer depth = 0;

        // 대댓글인 경우 부모 댓글 확인
        if (requestDto.getParentCommentId() != null) {
            parentComment = commentRepository.findById(requestDto.getParentCommentId())
                    .orElseThrow(() -> new IllegalArgumentException("Parent comment not found"));
            
            // 부모 댓글이 같은 게시글에 속하는지 확인
            if (!parentComment.getPost().getId().equals(postId)) {
                throw new IllegalArgumentException("Parent comment does not belong to this post");
            }
            
            depth = parentComment.getDepth() + 1;
            
            // 대댓글 깊이 제한 (2단계까지만 허용)
            if (depth > 2) {
                throw new IllegalArgumentException("Reply depth cannot exceed 2 levels");
            }
        }

        Comment comment = Comment.builder()
                .content(requestDto.getContent())
                .author(user)
                .post(post)
                .parentComment(parentComment)
                .depth(depth)
                .build();

        Comment savedComment = commentRepository.save(comment);

        // 포인트 지급 및 뱃지 체크 (원댓글인 경우에만)
        if (parentComment == null) {
            try {
                pointService.awardPointsForComment(user.getId(), savedComment.getId());
                badgeService.checkAndAwardBadges(user.getId());
            } catch (Exception e) {
                // 포인트/뱃지 시스템 오류가 댓글 작성에 영향을 주지 않도록 처리
                System.err.println("포인트/뱃지 시스템 오류: " + e.getMessage());
            }
        }

        // 알림 생성 (자기 자신에게는 보내지 않음)
        if (parentComment != null) {
            // 대댓글인 경우 부모 댓글 작성자에게 알림
            if (!parentComment.getAuthor().getId().equals(user.getId())) {
                String message = user.getNickname() + "님이 회원님의 댓글에 답글을 남겼습니다.";
                log.info("대댓글 알림 생성 - 대상: {}, 메시지: {}", parentComment.getAuthor().getEmail(), message);
                notificationService.createNotification(
                    parentComment.getAuthor(), 
                    message,
                    com.snippethub.api.domain.NotificationType.COMMENT,
                    "COMMENT",
                    comment.getId(), // 댓글 ID
                    post.getId()     // 게시글 ID (부모)
                );
            } else {
                log.info("자기 자신에게는 알림을 보내지 않음 - 사용자: {}", user.getEmail());
            }
        } else {
            // 원댓글인 경우 게시글 작성자에게 알림
            if (!post.getAuthor().getId().equals(user.getId())) {
                String message = user.getNickname() + "님이 회원님의 게시글에 댓글을 남겼습니다: " + post.getTitle();
                log.info("원댓글 알림 생성 - 대상: {}, 메시지: {}", post.getAuthor().getEmail(), message);
                notificationService.createNotification(
                    post.getAuthor(), 
                    message,
                    com.snippethub.api.domain.NotificationType.COMMENT,
                    "POST",
                    post.getId(),    // 게시글 ID
                    null            // 부모 ID 없음
                );
            } else {
                log.info("자기 자신에게는 알림을 보내지 않음 - 사용자: {}", user.getEmail());
            }
        }

        return CommentDto.CommentResponseDto.from(savedComment);
    }

    // 스니펫에 댓글 생성
    public CommentDto.CommentResponseDto createSnippetComment(Long snippetId, CommentDto.CommentRequestDto requestDto, String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElseThrow(() -> new IllegalArgumentException("User not found"));
        Snippet snippet = snippetRepository.findById(snippetId).orElseThrow(() -> new IllegalArgumentException("Snippet not found"));

        Comment parentComment = null;
        Integer depth = 0;

        // 대댓글인 경우 부모 댓글 확인
        if (requestDto.getParentCommentId() != null) {
            parentComment = commentRepository.findById(requestDto.getParentCommentId())
                    .orElseThrow(() -> new IllegalArgumentException("Parent comment not found"));
            
            // 부모 댓글이 같은 스니펫에 속하는지 확인
            if (!parentComment.getSnippet().getId().equals(snippetId)) {
                throw new IllegalArgumentException("Parent comment does not belong to this snippet");
            }
            
            depth = parentComment.getDepth() + 1;
            
            // 대댓글 깊이 제한 (2단계까지만 허용)
            if (depth > 2) {
                throw new IllegalArgumentException("Reply depth cannot exceed 2 levels");
            }
        }

        Comment comment = Comment.builder()
                .content(requestDto.getContent())
                .author(user)
                .snippet(snippet)
                .parentComment(parentComment)
                .depth(depth)
                .build();

        Comment savedComment = commentRepository.save(comment);

        // 포인트 지급 및 뱃지 체크 (원댓글인 경우에만)
        if (parentComment == null) {
            try {
                pointService.awardPointsForComment(user.getId(), savedComment.getId());
                badgeService.checkAndAwardBadges(user.getId());
            } catch (Exception e) {
                // 포인트/뱃지 시스템 오류가 댓글 작성에 영향을 주지 않도록 처리
                System.err.println("포인트/뱃지 시스템 오류: " + e.getMessage());
            }
        }

        // 알림 생성 (자기 자신에게는 보내지 않음)
        if (parentComment != null) {
            // 대댓글인 경우 부모 댓글 작성자에게 알림
            if (!parentComment.getAuthor().getId().equals(user.getId())) {
                String message = user.getNickname() + "님이 회원님의 댓글에 답글을 남겼습니다.";
                notificationService.createNotification(
                    parentComment.getAuthor(), 
                    message,
                    com.snippethub.api.domain.NotificationType.COMMENT,
                    "COMMENT",
                    comment.getId(), // 댓글 ID
                    snippet.getId()  // 스니펫 ID (부모)
                );
            }
        } else {
            // 원댓글인 경우 스니펫 작성자에게 알림
            if (!snippet.getAuthor().getId().equals(user.getId())) {
                String message = user.getNickname() + "님이 회원님의 스니펫에 댓글을 남겼습니다: " + snippet.getTitle();
                notificationService.createNotification(
                    snippet.getAuthor(), 
                    message,
                    com.snippethub.api.domain.NotificationType.COMMENT,
                    "SNIPPET",
                    snippet.getId(), // 스니펫 ID
                    null           // 부모 ID 없음
                );
            }
        }

        return CommentDto.CommentResponseDto.from(savedComment);
    }

    // 댓글 수정
    public CommentDto.CommentResponseDto updateComment(Long commentId, CommentDto.CommentRequestDto requestDto, String userEmail) {
        Comment comment = commentRepository.findById(commentId).orElseThrow(() -> new IllegalArgumentException("Comment not found"));
        if (!comment.getAuthor().getEmail().equals(userEmail)) {
            throw new IllegalStateException("You are not the author of this comment");
        }
        
        // 기존 댓글의 내용만 업데이트
        comment.updateContent(requestDto.getContent());
        
        return CommentDto.CommentResponseDto.from(comment);
    }

    // 댓글 삭제
    public void deleteComment(Long commentId, String userEmail) {
        Comment comment = commentRepository.findById(commentId).orElseThrow(() -> new IllegalArgumentException("Comment not found"));
        if (!comment.getAuthor().getEmail().equals(userEmail)) {
            throw new IllegalStateException("You are not the author of this comment");
        }
        commentRepository.delete(comment);
    }

    // 게시글의 댓글 목록 조회 (페이징)
    @Transactional(readOnly = true)
    public Page<CommentDto.CommentResponseDto> getPostComments(Long postId, Pageable pageable) {
        return commentRepository.findByPostId(postId, pageable).map(CommentDto.CommentResponseDto::from);
    }

    // 스니펫의 댓글 목록 조회 (페이징)
    @Transactional(readOnly = true)
    public Page<CommentDto.CommentResponseDto> getSnippetComments(Long snippetId, Pageable pageable) {
        return commentRepository.findBySnippetId(snippetId, pageable).map(CommentDto.CommentResponseDto::from);
    }

    // 게시글의 모든 댓글 목록 조회 (페이징 없음, 대댓글 포함)
    @Transactional(readOnly = true)
    public List<CommentDto.CommentResponseDto> getAllPostComments(Long postId) {
        return commentRepository.findByPostIdAndParentCommentIsNullOrderByCreatedAtAsc(postId)
                .stream()
                .map(CommentDto.CommentResponseDto::fromWithReplies)
                .collect(Collectors.toList());
    }

    // 스니펫의 모든 댓글 목록 조회 (페이징 없음, 대댓글 포함)
    @Transactional(readOnly = true)
    public List<CommentDto.CommentResponseDto> getAllSnippetComments(Long snippetId) {
        return commentRepository.findBySnippetIdAndParentCommentIsNullOrderByCreatedAtAsc(snippetId)
                .stream()
                .map(CommentDto.CommentResponseDto::fromWithReplies)
                .collect(Collectors.toList());
    }

    // 특정 댓글의 대댓글 목록 조회
    @Transactional(readOnly = true)
    public List<CommentDto.CommentResponseDto> getRepliesByCommentId(Long commentId) {
        return commentRepository.findByParentCommentIdOrderByCreatedAtAsc(commentId)
                .stream()
                .map(CommentDto.CommentResponseDto::from)
                .collect(Collectors.toList());
    }
}
