package com.snippethub.api.dto.user;

import com.snippethub.api.domain.User;
import lombok.Getter;

@Getter
public class UserDto {
    private final Long userId;
    private final String nickname;
    private final String profileImage;

    public UserDto(User user) {
        this.userId = user.getId();
        this.nickname = user.getNickname();
        this.profileImage = user.getProfileImage();
    }
}
