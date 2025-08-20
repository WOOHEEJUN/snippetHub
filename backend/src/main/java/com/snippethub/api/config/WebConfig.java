package com.snippethub.api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        // 프론트엔드 라우팅을 위한 설정
        registry.addViewController("/login").setViewName("forward:/index.html");
        registry.addViewController("/register").setViewName("forward:/index.html");
        registry.addViewController("/oauth2/callback").setViewName("forward:/index.html");
        registry.addViewController("/mypage").setViewName("forward:/index.html");
        registry.addViewController("/board").setViewName("forward:/index.html");
        registry.addViewController("/snippets").setViewName("forward:/index.html");
        registry.addViewController("/code-test").setViewName("forward:/index.html");
        registry.addViewController("/ai-problem-generation").setViewName("forward:/index.html");
        registry.addViewController("/ai-code-evaluation").setViewName("forward:/index.html");
        registry.addViewController("/daily-problems").setViewName("forward:/index.html");
        registry.addViewController("/submission-history").setViewName("forward:/index.html");
        registry.addViewController("/problems").setViewName("forward:/index.html");
        registry.addViewController("/point-history").setViewName("forward:/index.html");
        registry.addViewController("/badge-guide").setViewName("forward:/index.html");
        registry.addViewController("/grade-guide").setViewName("forward:/index.html");
        registry.addViewController("/notifications").setViewName("forward:/index.html");
    }
}
