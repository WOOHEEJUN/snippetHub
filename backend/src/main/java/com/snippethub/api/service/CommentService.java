package com.snippethub.api.service;

import com.snippethub.api.domain.Comment;
import com.snippethub.api.domain.Notification;
import com.snippethub.api.domain.Post;
import com.snippethub.api.domain.Snippet;
import com.snippethub.api.domain.User;
import com.snippethub.api.dto.comment.CommentCreateRequestDto;
import com.snippethub.api.dto.comment.CommentUpdateRequestDto;
import com.snippethub.api.exception.BusinessException;
import com.snippethub.api.exception.ErrorCode;
import com.snippethub.api.repository.CommentRepository;
import com.snippethub.api.repository.PostRepository;
import com.snippethub.api.repository.SnippetRepository;
import com.snippethub.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommentService {

    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final SnippetRepository snippetRepository;
    private final NotificationService notificationService;

    @Transactional
    public Comment createCommentForPost(Long postId, CommentCreateRequestDto requestDto, String email) {
        User author = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));

        Comment parentComment = null;
        if (requestDto.getParentCommentId() != null) {
            parentComment = commentRepository.findById(requestDto.getParentCommentId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.COMMENT_NOT_FOUND));
            // TODO: Check reply depth (max 3)
        }

        Comment comment = Comment.builder()
                .author(author)
                .post(post)
                .parent(parentComment)
                .content(requestDto.getContent())
                .build();

        post.increaseCommentCount();

        Comment savedComment = commentRepository.save(comment);

        // 알림 생성
        if (!post.getAuthor().getId().equals(author.getId())) { // 자신의 게시글에 댓글을 달면 알림 생성 안함
            notificationService.createNotification(
                    post.getAuthor().getId(),
                    Notification.NotificationType.COMMENT,
                    "새로운 댓글",
                    author.getNickname() + "님이 회원님의 게시글에 댓글을 남겼습니다: " + requestDto.getContent()
            );
        }

        return savedComment;
    }

    @Transactional
    public Comment createCommentForSnippet(Long snippetId, CommentCreateRequestDto requestDto, String email) {
        User author = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        Snippet snippet = snippetRepository.findById(snippetId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SNIPPET_NOT_FOUND));

        Comment parentComment = null;
        if (requestDto.getParentCommentId() != null) {
            parentComment = commentRepository.findById(requestDto.getParentCommentId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.COMMENT_NOT_FOUND));
            // TODO: Check reply depth (max 3)
        }

        Comment comment = Comment.builder()
                .author(author)
                .snippet(snippet)
                .parent(parentComment)
                .content(requestDto.getContent())
                .build();

        snippet.increaseCommentCount();

        Comment savedComment = commentRepository.save(comment);

        // 알림 생성
        if (!snippet.getAuthor().getId().equals(author.getId())) { // 자신의 스니펫에 댓글을 달면 알림 생성 안함
            notificationService.createNotification(
                    snippet.getAuthor().getId(),
                    Notification.NotificationType.COMMENT,
                    "새로운 댓글",
                    author.getNickname() + "님이 회원님의 스니펫에 댓글을 남겼습니다: " + requestDto.getContent()
            );
        }

        return savedComment;
    }

    public List<Comment> getCommentsForPost(Long postId) {
        return commentRepository.findByPostIdAndParentIsNullOrderByCreatedAtAsc(postId);
    }

    public List<Comment> getCommentsForSnippet(Long snippetId) {
        return commentRepository.findBySnippetIdAndParentIsNullOrderByCreatedAtAsc(snippetId);
    }

    @Transactional
    public Comment updateComment(Long commentId, CommentUpdateRequestDto requestDto, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COMMENT_NOT_FOUND));

        if (!comment.getAuthor().getId().equals(user.getId())) {
            throw new BusinessException(ErrorCode.NO_PERMISSION);
        }

        comment.updateContent(requestDto.getContent());
        return comment;
    }

    @Transactional
    public void deleteComment(Long commentId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COMMENT_NOT_FOUND));

        if (!comment.getAuthor().getId().equals(user.getId())) {
            throw new BusinessException(ErrorCode.NO_PERMISSION);
        }

        if (comment.getPost() != null) {
            comment.getPost().decreaseCommentCount();
        } else if (comment.getSnippet() != null) {
            comment.getSnippet().decreaseCommentCount();
        }

        commentRepository.delete(comment);
    }
}

