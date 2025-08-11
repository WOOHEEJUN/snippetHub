package com.snippethub.api.dto;

import com.snippethub.api.domain.Notification;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class NotificationDto {

    private Long id;
    private String message;
    private boolean isRead;
    private LocalDateTime createdAt;
    private String notificationType;
    private String targetType;
    private Long targetId;
    private Long parentId;

    public static NotificationDto from(Notification notification) {
        return NotificationDto.builder()
                .id(notification.getId())
                .message(notification.getMessage())
                .isRead(notification.getIsRead())
                .createdAt(notification.getCreatedAt())
                .notificationType(notification.getNotificationType() != null ? notification.getNotificationType().name() : null)
                .targetType(notification.getTargetType())
                .targetId(notification.getTargetId())
                .parentId(notification.getParentId())
                .build();
    }
}
