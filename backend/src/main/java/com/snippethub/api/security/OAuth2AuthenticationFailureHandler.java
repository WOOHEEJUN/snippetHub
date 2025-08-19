package com.snippethub.api.security;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Slf4j
@Component
public class OAuth2AuthenticationFailureHandler extends SimpleUrlAuthenticationFailureHandler {

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response,
                                      AuthenticationException exception) throws IOException, ServletException {
        
        log.error("OAuth2 로그인 실패: {}", exception.getMessage());
        
        String errorMessage = "Login failed";
        if (exception.getMessage().contains("email")) {
            errorMessage = "Email information required";
        } else if (exception.getMessage().contains("rate limit")) {
            errorMessage = "Too many requests. Please try again later";
        }
        
        String redirectUrl = UriComponentsBuilder
                .fromUriString("https://snippethub.co.kr/login")
                .queryParam("error", "oauth2_failed")
                .queryParam("message", errorMessage)
                .build()
                .encode()
                .toUriString();

        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
} 