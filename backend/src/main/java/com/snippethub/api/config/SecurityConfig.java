package com.snippethub.api.config;

import com.snippethub.api.security.JwtRequestFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import static org.springframework.security.config.Customizer.withDefaults;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.List;
// import com.snippethub.api.service.CustomOAuth2UserService; // 더 이상 필드로 주입하지 않으므로 주석 처리
import org.springframework.beans.factory.annotation.Autowired;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtRequestFilter jwtRequestFilter;
    // CustomOAuth2UserService 주입 코드 완전히 제거

    public SecurityConfig(JwtRequestFilter jwtRequestFilter) {
        this.jwtRequestFilter = jwtRequestFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, com.snippethub.api.service.CustomOAuth2UserService customOAuth2UserService, com.snippethub.api.security.OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler, com.snippethub.api.security.OAuth2AuthenticationFailureHandler oAuth2AuthenticationFailureHandler) throws Exception {
        http
            .cors(withDefaults())
            .csrf(csrf -> csrf.disable())
            .formLogin(form -> form.disable())
            .httpBasic(basic -> basic.disable())
            .authorizeHttpRequests(authorize -> authorize
                // API 엔드포인트들
                .requestMatchers("/ws/**").permitAll()
                .requestMatchers("/api/health").permitAll()
                .requestMatchers("/api/ai/**").permitAll()
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/v1/posts/**").permitAll()
                .requestMatchers("/api/posts/**").permitAll()
                .requestMatchers("/api/v1/snippets/**", "/api/v1/execute").permitAll()
                .requestMatchers("/api/snippets/**").permitAll()
                .requestMatchers("/api/daily-problems/**").permitAll()
                .requestMatchers("/api/problems/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/posts/{postId}/comments").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/snippets/{snippetId}/comments").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/posts/{postId}/comments").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/snippets/{snippetId}/comments").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/notifications").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/notifications/{notificationId}/read").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/notifications/unread-count").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/notifications/read-all").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/users/{userId}/profile").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/users/{userId}/posts").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/users/{userId}/snippets").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-resources/**", "/swagger-ui.html").permitAll()
                
                // 프론트엔드 라우팅 - 명시적으로 허용
                .requestMatchers("/").permitAll()
                .requestMatchers("/login").permitAll()
                .requestMatchers("/register").permitAll()
                .requestMatchers("/oauth2/callback").permitAll()
                .requestMatchers("/oauth2/redirect").permitAll()
                .requestMatchers("/mypage/**").permitAll()
                .requestMatchers("/board/**").permitAll()
                .requestMatchers("/snippets/**").permitAll()
                .requestMatchers("/code-test").permitAll()
                .requestMatchers("/ai-problem-generation").permitAll()
                .requestMatchers("/ai-code-evaluation").permitAll()
                .requestMatchers("/daily-problems").permitAll()
                .requestMatchers("/submission-history").permitAll()
                .requestMatchers("/problems/**").permitAll()
                .requestMatchers("/point-history").permitAll()
                .requestMatchers("/badge-guide").permitAll()
                .requestMatchers("/grade-guide").permitAll()
                .requestMatchers("/notifications").permitAll()
                .requestMatchers("/users/**").permitAll()
                
                // 정적 리소스들
                .requestMatchers("/static/**", "/css/**", "/js/**", "/images/**", "/favicon.ico").permitAll()
                .requestMatchers("/index.html").permitAll()
                
                // 나머지는 인증 필요
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class)
            .oauth2Login(oauth2 -> oauth2
                .userInfoEndpoint(userInfo -> userInfo
                    .userService(customOAuth2UserService)
                )
                .successHandler(oAuth2AuthenticationSuccessHandler)
                .failureHandler(oAuth2AuthenticationFailureHandler)
            );
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(
            "http://localhost:3000",
            "https://snippethub-frontend.s3-website.ap-northeast-2.amazonaws.com",
            "https://snippethub.co.kr"
        ));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setExposedHeaders(List.of("Authorization", "Content-Type"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }
}
