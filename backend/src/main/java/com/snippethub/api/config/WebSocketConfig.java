package com.snippethub.api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketTransportRegistration;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // 클라이언트가 구독할 수 있는 destination prefix 설정
        config.enableSimpleBroker("/topic", "/user");
        // 클라이언트가 서버로 메시지를 보낼 때 사용할 prefix 설정
        config.setApplicationDestinationPrefixes("/app");
        // 사용자별 메시지 prefix 설정
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // WebSocket 연결 엔드포인트 설정
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(
                    "http://localhost:3000",
                    "https://snippethub-frontend.s3-website.ap-northeast-2.amazonaws.com",
                    "https://d3vxt1w788wnw4.cloudfront.net",
                    "https://snippethub.co.kr",
                    "https://snippet.co.kr",
                    "https://snippethub-alb-120890630.ap-northeast-2.elb.amazonaws.com"
                )
                .withSockJS()
                .setHeartbeatTime(25000)
                .setDisconnectDelay(5000)
                .setHttpMessageCacheSize(1000)
                .setWebSocketEnabled(true)
                .setSessionCookieNeeded(false);
    }

    @Override
    public void configureWebSocketTransport(WebSocketTransportRegistration registration) {
        registration.setMessageSizeLimit(64 * 1024) // 64KB
                   .setSendBufferSizeLimit(512 * 1024) // 512KB
                   .setSendTimeLimit(20000); // 20초
    }
}
