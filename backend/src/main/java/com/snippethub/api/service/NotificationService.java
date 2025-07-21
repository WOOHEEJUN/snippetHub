package com.snippethub.api.service;

import com.snippethub.api.domain.Notification;
import com.snippethub.api.domain.User;
import com.snippethub.api.exception.BusinessException;
import com.snippethub.api.exception.ErrorCode;
import com.snippethub.api.repository.NotificationRepository;
import com.snippethub.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional
    public Notification createNotification(Long userId, Notification.NotificationType type, String title, String message) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        Notification notification = Notification.builder()
                .user(user)
                .type(type)
                .title(title)
                .message(message)
                .build();

        return notificationRepository.save(notification);
    }

    public Page<Notification> getNotifications(String email, Pageable pageable, boolean unreadOnly) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        if (unreadOnly) {
            return notificationRepository.findByUserIdAndIsRead(user.getId(), false, pageable);
        } else {
            return notificationRepository.findByUserId(user.getId(), pageable);
        }
    }

    public long getUnreadNotificationCount(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        return notificationRepository.countByUserIdAndIsRead(user.getId(), false);
    }

    @Transactional
    public Notification markNotificationAsRead(Long notificationId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTIFICATION_NOT_FOUND)); // TODO: Add NOTIFICATION_NOT_FOUND to ErrorCode

        if (!notification.getUser().getId().equals(user.getId())) {
            throw new BusinessException(ErrorCode.NO_PERMISSION);
        }

        notification.markAsRead();
        return notification;
    }
}
