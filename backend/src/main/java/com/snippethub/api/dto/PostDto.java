package com.snippethub.api.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class PostDto {
    private Long postId;
    private String title;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private AuthorDto author;

    @Data
    public static class AuthorDto {
        private Long userId;
        private String nickname;
    }
} 