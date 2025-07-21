package com.snippethub.api.controller;

import com.snippethub.api.domain.User;
import com.snippethub.api.dto.ApiResponse;
import com.snippethub.api.dto.token.TokenDto;
import com.snippethub.api.dto.user.UserDto;
import com.snippethub.api.dto.user.UserLoginRequestDto;
import com.snippethub.api.dto.user.UserLoginResponseDto;
import com.snippethub.api.dto.user.UserRegisterRequestDto;
import com.snippethub.api.dto.user.UserRegisterResponseDto;
import com.snippethub.api.exception.BusinessException;
import com.snippethub.api.exception.ErrorCode;
import com.snippethub.api.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserRegisterResponseDto>> register(@Valid @RequestBody UserRegisterRequestDto requestDto) {
        if (!requestDto.getPassword().equals(requestDto.getConfirmPassword())) {
            throw new BusinessException(ErrorCode.PASSWORD_MISMATCH);
        }
        User newUser = authService.register(requestDto);
        UserRegisterResponseDto responseDto = new UserRegisterResponseDto(newUser);
        return new ResponseEntity<>(ApiResponse.success("회원가입이 완료되었습니다. 이메일 인증을 완료해주세요.", responseDto), HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<UserLoginResponseDto>> login(@Valid @RequestBody UserLoginRequestDto requestDto) {
        Map.Entry<TokenDto, User> result = authService.login(requestDto);
        TokenDto tokenDto = result.getKey();
        User user = result.getValue();

        UserDto userDto = new UserDto(user);
        UserLoginResponseDto responseDto = UserLoginResponseDto.builder()
                .token(tokenDto)
                .user(userDto)
                .build();

        return ResponseEntity.ok(ApiResponse.success("로그인 성공", responseDto));
    }

    @GetMapping("/verify")
    public ResponseEntity<ApiResponse<String>> verifyEmail(@RequestParam("token") String token) {
        authService.verifyUser(token);
        return ResponseEntity.ok(ApiResponse.success("이메일 인증이 완료되었습니다. 이제 로그인할 수 있습니다."));
    }

    @PostMapping("/reissue")
    public ResponseEntity<ApiResponse<TokenDto>> reissue(@RequestHeader("Authorization") String refreshToken) {
        TokenDto tokenDto = authService.reissue(refreshToken.substring(7)); // "Bearer " 제거
        return ResponseEntity.ok(ApiResponse.success("토큰 재발급 성공", tokenDto));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<String>> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        authService.forgotPassword(email);
        return ResponseEntity.ok(ApiResponse.success("비밀번호 재설정 이메일이 발송되었습니다."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<String>> resetPassword(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        String newPassword = request.get("newPassword");
        String confirmNewPassword = request.get("confirmNewPassword");

        if (!newPassword.equals(confirmNewPassword)) {
            throw new BusinessException(ErrorCode.PASSWORD_MISMATCH);
        }

        authService.resetPassword(token, newPassword);
        return ResponseEntity.ok(ApiResponse.success("비밀번호가 성공적으로 재설정되었습니다."));
    }
}

