package com.snippethub.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebSocketNotificationDto {
    private Long id;
    private String message;
    private String notificationType;
    private String targetType;
    private Long targetId;
    private Long parentId;
    private LocalDateTime createdAt;
    private boolean isRead;
}
