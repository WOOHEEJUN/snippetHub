package com.snippethub.api.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CommentDto {
    private Long commentId;
    private Long userId;
    private Long postId;
    private Long snippetId;
    private String content;
    private LocalDateTime createdAt;
} 