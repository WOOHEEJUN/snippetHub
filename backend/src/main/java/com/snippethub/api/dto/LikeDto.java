package com.snippethub.api.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class LikeDto {
    private Long likeId;
    private Long userId;
    private Long postId;
    private Long snippetId;
    private LocalDateTime createdAt;
} 