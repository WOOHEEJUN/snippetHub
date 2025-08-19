package com.snippethub.api.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.snippethub.api.domain.User;
import com.snippethub.api.dto.ApiResponse;
import com.snippethub.api.dto.token.TokenDto;
import com.snippethub.api.dto.user.UserDto;
import com.snippethub.api.dto.user.UserLoginResponseDto;
import com.snippethub.api.service.PointService;
import com.snippethub.api.service.UserService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final TokenProvider tokenProvider;
    private final UserService userService;
    private final ObjectMapper objectMapper;
    private final PointService pointService;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                      Authentication authentication) throws IOException, ServletException {
        
        log.info("OAuth2 로그인 성공 시작");
        
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = extractEmail(oAuth2User);
        
        log.info("추출된 이메일: {}", email);
        
        if (email == null) {
            // 이메일이 없는 경우 에러 페이지로 리다이렉트
            getRedirectStrategy().sendRedirect(request, response, 
                "https://snippet.co.kr/login?error=email_required");
            return;
        }

        // 사용자 정보 조회
        final String finalEmail = email;
        User user = userService.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found after OAuth2 login"));

        // JWT 토큰 생성
        TokenDto tokenDto = tokenProvider.generateTokenDto(authentication);

        // 응답 데이터 생성
        UserDto userDto = new UserDto(user);
        UserLoginResponseDto responseDto = UserLoginResponseDto.builder()
                .token(tokenDto)
                .user(userDto)
                .build();

        ApiResponse<UserLoginResponseDto> apiResponse = ApiResponse.success("소셜 로그인 성공", responseDto);

        // 로그인 포인트 지급
        try {
            pointService.awardPointsForLogin(user.getId());
        } catch (Exception e) {
            // 포인트 시스템 오류가 로그인에 영향을 주지 않도록 처리
            log.error("소셜 로그인 포인트 지급 중 오류 발생: {}", e.getMessage());
        }

        // 프론트엔드로 리다이렉트 (토큰을 URL 파라미터로 전달)
        String redirectUrl = String.format(
            "https://snippet.co.kr/oauth2/callback?accessToken=%s&refreshToken=%s&user=%s",
            tokenDto.getAccessToken(),
            tokenDto.getRefreshToken(),
            java.net.URLEncoder.encode(objectMapper.writeValueAsString(userDto), "UTF-8")
        );

        log.info("OAuth2 로그인 성공 - 리다이렉트 URL: {}", redirectUrl);
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
    
    private String extractEmail(OAuth2User oAuth2User) {
        String email = oAuth2User.getAttribute("email");
        
        if (email == null) {
            // 카카오의 경우 kakao_account에서 email 추출
            if (oAuth2User.getAttribute("kakao_account") != null) {
                @SuppressWarnings("unchecked")
                var kakaoAccount = (java.util.Map<String, Object>) oAuth2User.getAttribute("kakao_account");
                email = (String) kakaoAccount.get("email");
            }
        }
        
        return email;
    }
} 