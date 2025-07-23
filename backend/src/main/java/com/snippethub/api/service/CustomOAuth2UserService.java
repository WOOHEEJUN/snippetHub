package com.snippethub.api.service;

import com.snippethub.api.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {
    private final UserService userService;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        String registrationId = userRequest.getClientRegistration().getRegistrationId(); // 'kakao', 'google', 'naver' 등
        Map<String, Object> attributes = oAuth2User.getAttributes();

        String provider = registrationId;
        String providerId = null;
        String email = null;
        String nickname = null;

        // provider별로 데이터 추출 방식 분기
        if ("kakao".equals(provider)) {
            Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
            Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get("profile");
            providerId = String.valueOf(attributes.get("id"));
            email = (String) kakaoAccount.get("email");
            nickname = (String) profile.get("nickname");
            
            // 이메일이 없는 경우 providerId를 이메일로 사용 (임시)
            if (email == null || email.isEmpty()) {
                email = "kakao_" + providerId + "@kakao.com";
            }
        } else if ("google".equals(provider)) {
            providerId = (String) attributes.get("sub");
            email = (String) attributes.get("email");
            nickname = (String) attributes.get("name");
        } else if ("naver".equals(provider)) {
            Map<String, Object> response = (Map<String, Object>) attributes.get("response");
            providerId = (String) response.get("id");
            email = (String) response.get("email");
            nickname = (String) response.get("nickname");
        }

        // UserService를 통해 DB에 저장/조회
        User user = userService.processOAuth2User(provider, providerId, email, nickname);

        String userNameAttributeName = userRequest.getClientRegistration()
                                                .getProviderDetails()
                                                .getUserInfoEndpoint()
                                                .getUserNameAttributeName();
        // attributes.put("provider", registrationId); // 되돌림: provider를 attributes에 추가하지 않음
        return new DefaultOAuth2User(
                Collections.singleton(new SimpleGrantedAuthority("ROLE_USER")),
                attributes,
                userNameAttributeName
        );
    }
} 