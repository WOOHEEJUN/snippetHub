package com.snippethub.api.service;

import com.snippethub.api.domain.User;
import com.snippethub.api.exception.BusinessException;
import com.snippethub.api.exception.ErrorCode;
import com.snippethub.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        System.out.println("[CustomUserDetailsService] email로 유저 조회 시도: " + username);
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> {
                    System.out.println("[CustomUserDetailsService] 유저를 찾을 수 없음: " + username);
                    return new BusinessException(ErrorCode.LOGIN_INPUT_INVALID);
                });
        System.out.println("[CustomUserDetailsService] 유저 조회 성공: " + user.getEmail());

        // if (!user.isVerified()) {
        //     throw new BusinessException(ErrorCode.EMAIL_NOT_VERIFIED); // TODO: Add EMAIL_NOT_VERIFIED to ErrorCode
        // }

        return createUserDetails(user);
    }

    // DB 에 User 값이 존재한다면 UserDetails 객체로 만들어서 리턴
    private UserDetails createUserDetails(User user) {
        GrantedAuthority grantedAuthority = new SimpleGrantedAuthority("ROLE_USER"); // 기본 권한

        // 소셜 로그인 사용자의 경우 password가 null일 수 있음
        String password = user.getPassword() != null ? user.getPassword() : "";

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                password,
                Collections.singleton(grantedAuthority)
        );
    }
}
