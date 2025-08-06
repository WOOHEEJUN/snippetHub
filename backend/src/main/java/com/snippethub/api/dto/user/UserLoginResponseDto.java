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

    // Lombok이 제대로 작동하지 않을 경우를 대비한 수동 builder
    public static UserLoginResponseDtoBuilder builder() {
        return new UserLoginResponseDtoBuilder();
    }

    public static class UserLoginResponseDtoBuilder {
        private TokenDto token;
        private UserDto user;

        public UserLoginResponseDtoBuilder token(TokenDto token) {
            this.token = token;
            return this;
        }

        public UserLoginResponseDtoBuilder user(UserDto user) {
            this.user = user;
            return this;
        }

        public UserLoginResponseDto build() {
            return new UserLoginResponseDto(token, user);
        }
    }
}
