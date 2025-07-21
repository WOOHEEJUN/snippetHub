package com.snippethub.api.dto.user;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
public class UserProfileUpdateRequestDto {

    @Size(min = 2, max = 20, message = "닉네임은 2~20자 한글, 영문, 숫자를 사용하세요.")
    private String nickname;

    @Size(max = 500, message = "자기소개는 500자 이하로 입력해주세요.")
    private String bio;

    private MultipartFile profileImage;
}
