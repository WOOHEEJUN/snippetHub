package com.snippethub.api.service;

import com.snippethub.api.domain.Notification;
import com.snippethub.api.domain.User;
import com.snippethub.api.dto.NotificationDto;
import com.snippethub.api.repository.NotificationRepository;
import com.snippethub.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository; // UserRepository 주입

    // 알림 생성 (내부 호출용)
    public void createNotification(User user, String message) {
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