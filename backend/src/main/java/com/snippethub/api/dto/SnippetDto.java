package com.snippethub.api.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SnippetDto {
    private Long snippetId;
    private String title;
    private String description;
    private String language;
    private String code;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private AuthorDto author;

    @Data
    public static class AuthorDto {
        private Long userId;
        private String nickname;
    }
} 