package com.snippethub.api.service;

import com.snippethub.api.domain.Notification;
import com.snippethub.api.domain.NotificationType;
import com.snippethub.api.domain.User;
import com.snippethub.api.dto.NotificationDto;
import com.snippethub.api.dto.WebSocketNotificationDto;
import com.snippethub.api.repository.NotificationRepository;
import com.snippethub.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    // 알림 생성 (내부 호출용)
    public void createNotification(User user, String message) {
        createNotification(user, message, null, null, null, null);
    }

    // 실시간 알림 생성 (WebSocket 포함)
    public void createNotification(User user, String message, NotificationType type, String targetType, Long targetId, Long parentId) {
        log.info("알림 생성 시작 - 사용자: {}, 메시지: {}", user.getEmail(), message);
        
        Notification notification = Notification.builder()
                .user(user)
                .message(message)
                .isRead(false)
                .notificationType(type)
                .targetType(targetType)
                .targetId(targetId)
                .parentId(parentId)
                .build();
        
        Notification savedNotification = notificationRepository.save(notification);
        log.info("알림 저장 완료 - ID: {}", savedNotification.getId());
        
        // WebSocket을 통해 실시간 알림 전송
        WebSocketNotificationDto wsNotification = WebSocketNotificationDto.builder()
                .id(savedNotification.getId())
                .message(savedNotification.getMessage())
                .notificationType(savedNotification.getNotificationType() != null ? savedNotification.getNotificationType().name() : null)
                .targetType(savedNotification.getTargetType())
                .targetId(savedNotification.getTargetId())
                .parentId(savedNotification.getParentId())
                .createdAt(savedNotification.getCreatedAt())
                .isRead(savedNotification.getIsRead())
                .build();
        
        try {
            messagingTemplate.convertAndSendToUser(
                user.getEmail(),
                "/queue/notifications",
                wsNotification
            );
            log.info("WebSocket 알림 전송 완료 - 사용자: {}, 메시지: {}", user.getEmail(), message);
        } catch (Exception e) {
            log.error("WebSocket 알림 전송 실패 - 사용자: {}, 오류: {}", user.getEmail(), e.getMessage(), e);
        }
    }

    // 간단한 테스트 알림 생성 (WebSocket 없이)
    public void createSimpleNotification(String userEmail, String message) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Notification notification = Notification.builder()
                .user(user)
                .message(message)
                .isRead(false)
                .build();
        
        notificationRepository.save(notification);
    }

    // 내 알림 목록 조회
    @Transactional(readOnly = true)
    public List<NotificationDto> getMyNotifications(String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElseThrow(() -> new IllegalArgumentException("User not found"));
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(NotificationDto::from)
                .collect(Collectors.toList());
    }

    // 알림 읽음 처리
    public void markAsRead(Long notificationId, String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElseThrow(() -> new IllegalArgumentException("User not found"));
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        if (!notification.getUser().getId().equals(user.getId())) {
            throw new IllegalStateException("You are not the owner of this notification");
        }
        // Notification 엔티티에 setter가 없으므로, 빌더를 사용하여 새로운 인스턴스를 생성합니다.
        Notification readNotification = Notification.builder()
            .id(notification.getId())
            .user(notification.getUser())
            .message(notification.getMessage())
            .isRead(true) // 이 값을 true로 변경
            .createdAt(notification.getCreatedAt())
            .build();
        notificationRepository.save(readNotification);
    }

    // 읽지 않은 알림 개수 조회
    @Transactional(readOnly = true)
    public Long getUnreadCount(String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElseThrow(() -> new IllegalArgumentException("User not found"));
        return notificationRepository.countByUserIdAndIsReadFalse(user.getId());
    }

    // 모든 알림 읽음 처리
    public void markAllAsRead(String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElseThrow(() -> new IllegalArgumentException("User not found"));
        List<Notification> unreadNotifications = notificationRepository.findByUserIdAndIsReadFalse(user.getId());
        
        for (Notification notification : unreadNotifications) {
            Notification readNotification = Notification.builder()
                .id(notification.getId())
                .user(notification.getUser())
                .message(notification.getMessage())
                .isRead(true)
                .createdAt(notification.getCreatedAt())
                .build();
            notificationRepository.save(readNotification);
        }
    }
}