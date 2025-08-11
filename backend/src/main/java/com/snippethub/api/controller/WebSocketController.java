package com.snippethub.api.controller;

import com.snippethub.api.dto.WebSocketNotificationDto;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class WebSocketController {

    private final SimpMessagingTemplate messagingTemplate;

    // 특정 사용자에게 알림 전송
    public void sendNotificationToUser(String userEmail, WebSocketNotificationDto notification) {
        messagingTemplate.convertAndSendToUser(
            userEmail,
            "/queue/notifications",
            notification
        );
    }

    // 전체 사용자에게 브로드캐스트
    public void broadcastNotification(WebSocketNotificationDto notification) {
        messagingTemplate.convertAndSend("/topic/notifications", notification);
    }
}
