package com.snippethub.api.dto.user;

import com.snippethub.api.dto.token.TokenDto;
import lombok.Builder;
import lombok.Getter;

@Getter
public class UserLoginResponseDto {

    private final TokenDto token;
    private final UserDto user;

    @Builder
    public UserLoginResponseDto(TokenDto token, UserDto user) {
        this.token = token;
        this.user = user;
    }
}
