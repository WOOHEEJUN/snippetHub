package com.snippethub.api.service;

import com.snippethub.api.domain.User;
import com.snippethub.api.domain.VerificationToken;
import com.snippethub.api.dto.token.TokenDto;
import com.snippethub.api.dto.user.UserLoginRequestDto;
import com.snippethub.api.dto.user.UserRegisterRequestDto;
import com.snippethub.api.exception.BusinessException;
import com.snippethub.api.exception.EmailDuplicateException;
import com.snippethub.api.exception.NicknameDuplicateException;
import com.snippethub.api.repository.RefreshTokenRepository;
import com.snippethub.api.repository.UserRepository;
import com.snippethub.api.repository.VerificationTokenRepository;
import com.snippethub.api.security.TokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @InjectMocks
    private AuthService authService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private TokenProvider tokenProvider;

    @Mock
    private AuthenticationManagerBuilder authenticationManagerBuilder;

    @Mock
    private VerificationTokenRepository verificationTokenRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private AuthenticationManager authenticationManager;

    private UserRegisterRequestDto registerRequestDto;
    private UserLoginRequestDto loginRequestDto;
    private User user;
    private TokenDto tokenDto;

    @BeforeEach
    void setUp() {
        registerRequestDto = new UserRegisterRequestDto();
        registerRequestDto.setEmail("test@example.com");
        registerRequestDto.setPassword("password123!@#");
        registerRequestDto.setConfirmPassword("password123!@#");
        registerRequestDto.setNickname("testuser");
        registerRequestDto.setAgreeToTerms(true);

        loginRequestDto = new UserLoginRequestDto();
        loginRequestDto.setEmail("test@example.com");
        loginRequestDto.setPassword("password123!@#");

        user = User.builder()
                .email("test@example.com")
                .password("encodedPassword")
                .nickname("testuser")
                .build();

        tokenDto = TokenDto.builder()
                .grantType("Bearer")
                .accessToken("accessToken")
                .refreshToken("refreshToken")
                .accessTokenExpiresIn(3600L)
                .build();

        when(authenticationManagerBuilder.getObject()).thenReturn(authenticationManager);
    }

    @Test
    @DisplayName("회원가입 성공")
    void registerSuccess() {
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByNickname(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(verificationTokenRepository.save(any(VerificationToken.class))).thenReturn(any(VerificationToken.class));
        doNothing().when(emailService).sendVerificationEmail(anyString(), anyString());

        User registeredUser = authService.register(registerRequestDto);

        assertThat(registeredUser.getEmail()).isEqualTo(registerRequestDto.getEmail());
        assertThat(registeredUser.getNickname()).isEqualTo(registerRequestDto.getNickname());
        verify(userRepository, times(1)).save(any(User.class));
        verify(verificationTokenRepository, times(1)).save(any(VerificationToken.class));
        verify(emailService, times(1)).sendVerificationEmail(anyString(), anyString());
    }

    @Test
    @DisplayName("회원가입 실패 - 이메일 중복")
    void registerFail_EmailDuplicate() {
        when(userRepository.existsByEmail(anyString())).thenReturn(true);

        assertThatThrownBy(() -> authService.register(registerRequestDto))
                .isInstanceOf(EmailDuplicateException.class);
    }

    @Test
    @DisplayName("회원가입 실패 - 닉네임 중복")
    void registerFail_NicknameDuplicate() {
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByNickname(anyString())).thenReturn(true);

        assertThatThrownBy(() -> authService.register(registerRequestDto))
                .isInstanceOf(NicknameDuplicateException.class);
    }

    @Test
    @DisplayName("로그인 성공")
    void loginSuccess() {
        Authentication authentication = mock(Authentication.class);
        when(authentication.getName()).thenReturn(user.getEmail());
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(authentication);
        when(tokenProvider.generateTokenDto(any(Authentication.class))).thenReturn(tokenDto);
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(user));
        when(refreshTokenRepository.save(any())).thenReturn(any());

        Map.Entry<TokenDto, User> result = authService.login(loginRequestDto);

        assertThat(result.getKey()).isEqualTo(tokenDto);
        assertThat(result.getValue()).isEqualTo(user);
        verify(refreshTokenRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("이메일 인증 성공")
    void verifyUserSuccess() {
        VerificationToken verificationToken = new VerificationToken(user);
        verificationToken.setExpiryDate(LocalDateTime.now().plusHours(1));

        when(verificationTokenRepository.findByToken(anyString())).thenReturn(Optional.of(verificationToken));
        when(userRepository.save(any(User.class))).thenReturn(user);
        doNothing().when(verificationTokenRepository).delete(any(VerificationToken.class));

        authService.verifyUser("validToken");

        assertThat(user.isVerified()).isTrue();
        verify(userRepository, times(1)).save(user);
        verify(verificationTokenRepository, times(1)).delete(verificationToken);
    }

    @Test
    @DisplayName("이메일 인증 실패 - 유효하지 않은 토큰")
    void verifyUserFail_InvalidToken() {
        when(verificationTokenRepository.findByToken(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.verifyUser("invalidToken"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("유효하지 않은 인증 토큰입니다.");
    }

    @Test
    @DisplayName("이메일 인증 실패 - 만료된 토큰")
    void verifyUserFail_ExpiredToken() {
        VerificationToken verificationToken = new VerificationToken(user);
        verificationToken.setExpiryDate(LocalDateTime.now().minusHours(1));

        when(verificationTokenRepository.findByToken(anyString())).thenReturn(Optional.of(verificationToken));

        assertThatThrownBy(() -> authService.verifyUser("expiredToken"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("만료된 인증 토큰입니다.");
    }

    @Test
    @DisplayName("토큰 재발급 성공")
    void reissueSuccess() {
        Authentication authentication = mock(Authentication.class);
        when(authentication.getName()).thenReturn(user.getId().toString());

        when(tokenProvider.validateToken(anyString())).thenReturn(true);
        when(tokenProvider.getAuthentication(anyString())).thenReturn(authentication);
        when(refreshTokenRepository.findById(anyString())).thenReturn(Optional.of(new com.snippethub.api.domain.RefreshToken(user.getId().toString(), "oldRefreshToken")));
        when(tokenProvider.generateTokenDto(any(Authentication.class))).thenReturn(tokenDto);
        when(refreshTokenRepository.save(any())).thenReturn(any());

        TokenDto result = authService.reissue("oldRefreshToken");

        assertThat(result).isEqualTo(tokenDto);
        verify(refreshTokenRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("토큰 재발급 실패 - 유효하지 않은 리프레시 토큰")
    void reissueFail_InvalidRefreshToken() {
        when(tokenProvider.validateToken(anyString())).thenReturn(false);

        assertThatThrownBy(() -> authService.reissue("invalidRefreshToken"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("유효하지 않은 토큰입니다.");
    }
}
