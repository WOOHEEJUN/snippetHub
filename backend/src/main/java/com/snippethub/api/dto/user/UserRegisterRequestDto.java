package com.snippethub.api.dto.user;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserRegisterRequestDto {

    @NotBlank(message = "이메일은 필수 입력 값입니다.")
    @Email(message = "이메일 형식에 맞지 않습니다.")
    private String email;

    @NotBlank(message = "비밀번호는 필수 입력 값입니다.")
    @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[$@$!%*#?&])[A-Za-z\\d$@$!%*#?&]{8,20}$", 
             message = "비밀번호는 8~20자 영문, 숫자, 특수문자를 사용하세요.")
    private String password;

    @NotBlank(message = "비밀번호 확인은 필수입니다.")
    private String confirmPassword;

    @NotBlank(message = "닉네임은 필수 입력 값입니다.")
    @Pattern(regexp = "^[가-힣a-zA-Z0-9]{2,20}$", message = "닉네임은 2~20자 한글, 영문, 숫자를 사용하세요.")
    private String nickname;

    @AssertTrue(message = "이용약관에 동의해야 합니다.")
    private boolean agreeToTerms;

    // Lombok이 제대로 작동하지 않을 경우를 대비한 수동 getter 메서드
    public String getEmail() {
        return email;
    }

    public String getPassword() {
        return password;
    }

    public String getConfirmPassword() {
        return confirmPassword;
    }

    public String getNickname() {
        return nickname;
    }

    public boolean isAgreeToTerms() {
        return agreeToTerms;
    }
}
