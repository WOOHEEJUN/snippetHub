package com.snippethub.api.dto;

import com.snippethub.api.domain.Comment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import java.util.ArrayList;

public class CommentDto {

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CommentRequestDto {
        private String content;
        private Long parentCommentId; // 대댓글을 위한 부모 댓글 ID
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CommentResponseDto {
        private Long commentId; // 프론트엔드 호환성을 위해 commentId로 변경
        private String content;
        private String authorNickname;
        private LocalDateTime createdAt;
        private Long parentCommentId; // 대댓글을 위한 부모 댓글 ID
        private Integer depth; // 댓글 깊이 (0: 원댓글, 1: 대댓글, 2: 대대댓글)
        private List<CommentResponseDto> replies; // 대댓글 목록
        private Integer replyCount; // 대댓글 개수
        private AuthorInfo author; // 프론트엔드 호환성을 위해 author 객체 추가

        public static CommentResponseDto from(Comment comment) {
            if (comment == null) return null;
            
            return CommentResponseDto.builder()
                    .commentId(comment.getId())
                    .content(comment.getContent())
                    .authorNickname(comment.getAuthor() != null ? comment.getAuthor().getNickname() : "알 수 없는 사용자")
                    .createdAt(comment.getCreatedAt())
                    .parentCommentId(comment.getParentComment() != null ? comment.getParentComment().getId() : null)
                    .depth(comment.getDepth() != null ? comment.getDepth() : 0)
                    .replyCount(comment.getReplies() != null ? comment.getReplies().size() : 0)
                    .author(comment.getAuthor() != null ? AuthorInfo.builder()
                            .userId(comment.getAuthor().getId())
                            .nickname(comment.getAuthor().getNickname())
                            .profileImage(comment.getAuthor().getProfileImage())
                            .build() : null)
                    .build();
        }

        public static CommentResponseDto fromWithReplies(Comment comment) {
            if (comment == null) return null;
            
            List<CommentResponseDto> replies = comment.getReplies() != null ? 
                comment.getReplies().stream()
                    .map(CommentResponseDto::from)
                    .filter(reply -> reply != null)
                    .collect(Collectors.toList()) : 
                new ArrayList<>();

            return CommentResponseDto.builder()
                    .commentId(comment.getId())
                    .content(comment.getContent())
                    .authorNickname(comment.getAuthor() != null ? comment.getAuthor().getNickname() : "알 수 없는 사용자")
                    .createdAt(comment.getCreatedAt())
                    .parentCommentId(comment.getParentComment() != null ? comment.getParentComment().getId() : null)
                    .depth(comment.getDepth() != null ? comment.getDepth() : 0)
                    .replies(replies)
                    .replyCount(comment.getReplies() != null ? comment.getReplies().size() : 0)
                    .author(comment.getAuthor() != null ? AuthorInfo.builder()
                            .userId(comment.getAuthor().getId())
                            .nickname(comment.getAuthor().getNickname())
                            .profileImage(comment.getAuthor().getProfileImage())
                            .build() : null)
                    .build();
        }
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AuthorInfo {
        private Long userId;
        private String nickname;
        private String profileImage;
    }
} 