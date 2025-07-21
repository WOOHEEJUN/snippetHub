package com.snippethub.api.dto.notification;

import com.snippethub.api.domain.Notification;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class NotificationResponseDto {

    private final Long notificationId;
    private final String type;
    private final String title;
    private final String message;
    private final boolean isRead;
    private final LocalDateTime createdAt;

    public NotificationResponseDto(Notification notification) {
        this.notificationId = notification.getId();
        this.type = notification.getType().name();
        this.title = notification.getTitle();
        this.message = notification.getMessage();
        this.isRead = notification.isRead();
        this.createdAt = notification.getCreatedAt();
    }
}
