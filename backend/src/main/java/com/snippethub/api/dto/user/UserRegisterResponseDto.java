package com.snippethub.api.dto.user;

import com.snippethub.api.domain.User;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class UserRegisterResponseDto {
    private final Long userId;
    private final String email;
    private final String nickname;
    private final LocalDateTime createdAt;
    private final boolean verificationRequired = true; // 이메일 인증 기능 추가 시 사용

    public UserRegisterResponseDto(User user) {
        this.userId = user.getId();
        this.email = user.getEmail();
        this.nickname = user.getNickname();
        this.createdAt = user.getCreatedAt();
    }
}
