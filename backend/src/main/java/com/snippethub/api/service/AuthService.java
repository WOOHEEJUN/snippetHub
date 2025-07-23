package com.snippethub.api.service;

import com.snippethub.api.domain.PasswordResetToken;
import com.snippethub.api.domain.RefreshToken;
import com.snippethub.api.domain.User;
import com.snippethub.api.domain.VerificationToken;
import com.snippethub.api.dto.token.TokenDto;
import com.snippethub.api.dto.user.UserLoginRequestDto;
import com.snippethub.api.dto.user.UserRegisterRequestDto;
import com.snippethub.api.exception.BusinessException;
import com.snippethub.api.exception.EmailDuplicateException;
import com.snippethub.api.exception.ErrorCode;
import com.snippethub.api.exception.NicknameDuplicateException;
import com.snippethub.api.repository.PasswordResetTokenRepository;
import com.snippethub.api.repository.RefreshTokenRepository;
import com.snippethub.api.repository.UserRepository;
import com.snippethub.api.repository.VerificationTokenRepository;
import com.snippethub.api.security.TokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.AbstractMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenProvider tokenProvider;
    private final AuthenticationManagerBuilder authenticationManagerBuilder;
    private final VerificationTokenRepository verificationTokenRepository;
    private final EmailService emailService;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;

    @Transactional
    public User register(UserRegisterRequestDto requestDto) {
        if (userRepository.existsByEmail(requestDto.getEmail())) {
            throw new EmailDuplicateException();
        }
        if (userRepository.existsByNickname(requestDto.getNickname())) {
            throw new NicknameDuplicateException();
        }

        String encodedPassword = passwordEncoder.encode(requestDto.getPassword());

        User newUser = User.builder()
                .email(requestDto.getEmail())
                .password(encodedPassword)
                .nickname(requestDto.getNickname())
                .build();
        
        // 개발 환경에서는 자동으로 인증 완료
        newUser.setIsVerified(true);

        User savedUser = userRepository.save(newUser);

        VerificationToken verificationToken = new VerificationToken(savedUser);
        verificationTokenRepository.save(verificationToken);

        // emailService.sendVerificationEmail(savedUser.getEmail(), verificationToken.getToken());

        return savedUser;
    }

    @Transactional
    public Map.Entry<TokenDto, User> login(UserLoginRequestDto requestDto) {
        UsernamePasswordAuthenticationToken authenticationToken = 
            new UsernamePasswordAuthenticationToken(requestDto.getEmail(), requestDto.getPassword());

        Authentication authentication = authenticationManagerBuilder.getObject().authenticate(authenticationToken);

        TokenDto tokenDto = tokenProvider.generateTokenDto(authentication);

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // 기존 refresh token이 있다면 업데이트, 없으면 새로 생성
        RefreshToken refreshToken = refreshTokenRepository.findByUser(user)
                .orElse(RefreshToken.builder()
                        .user(user)
                        .token("")
                        .expiryDate(tokenProvider.getRefreshTokenExpiryDate())
                        .build());
        
        refreshToken.updateToken(tokenDto.getRefreshToken(), tokenProvider.getRefreshTokenExpiryDate());
        refreshTokenRepository.save(refreshToken);

        return new AbstractMap.SimpleEntry<>(tokenDto, user);
    }

    @Transactional
    public void verifyUser(String token) {
        VerificationToken verificationToken = verificationTokenRepository.findByToken(token)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_VERIFICATION_TOKEN));

        if (verificationToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new BusinessException(ErrorCode.EXPIRED_VERIFICATION_TOKEN);
        }

        User user = verificationToken.getUser();
        user.setIsVerified(true);
        userRepository.save(user);
        verificationTokenRepository.delete(verificationToken);
    }

    @Transactional
    public TokenDto reissue(String refreshToken) {
        if (!tokenProvider.validateToken(refreshToken)) {
            throw new BusinessException(ErrorCode.INVALID_TOKEN);
        }

        Authentication authentication = tokenProvider.getAuthentication(refreshToken);

        RefreshToken storedRefreshToken = refreshTokenRepository.findByToken(refreshToken)
                .orElseThrow(() -> new BusinessException(ErrorCode.REFRESH_TOKEN_NOT_FOUND));

        if (!storedRefreshToken.getToken().equals(refreshToken)) {
            throw new BusinessException(ErrorCode.INVALID_TOKEN);
        }

        TokenDto tokenDto = tokenProvider.generateTokenDto(authentication);

        storedRefreshToken.updateToken(tokenDto.getRefreshToken(), tokenProvider.getRefreshTokenExpiryDate());
        refreshTokenRepository.save(storedRefreshToken);

        return tokenDto;
    }

    @Transactional
    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND)); // TODO: Consider not exposing user existence

        PasswordResetToken existingToken = passwordResetTokenRepository.findByUser(user).orElse(null); // TODO: Add findByUser to PasswordResetTokenRepository
        if (existingToken != null) {
            passwordResetTokenRepository.delete(existingToken);
        }

        PasswordResetToken resetToken = new PasswordResetToken(user);
        passwordResetTokenRepository.save(resetToken);

        emailService.sendPasswordResetEmail(user.getEmail(), resetToken.getToken());
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_PASSWORD_RESET_TOKEN)); // TODO: Add INVALID_PASSWORD_RESET_TOKEN to ErrorCode

        if (resetToken.isExpired()) {
            passwordResetTokenRepository.delete(resetToken);
            throw new BusinessException(ErrorCode.EXPIRED_PASSWORD_RESET_TOKEN); // TODO: Add EXPIRED_PASSWORD_RESET_TOKEN to ErrorCode
        }

        User user = resetToken.getUser();
        user.updatePassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        passwordResetTokenRepository.delete(resetToken);
    }
}



