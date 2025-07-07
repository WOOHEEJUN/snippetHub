package com.snippethub.api.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UserDto {
    private Long userId;
    private String email;
    private String nickname;
    private String grade;
    private LocalDateTime createdAt;
} 