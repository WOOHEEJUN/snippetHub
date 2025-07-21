package com.snippethub.api.controller;

import com.snippethub.api.domain.Notification;
import com.snippethub.api.dto.ApiResponse;
import com.snippethub.api.dto.PageResponseDto;
import com.snippethub.api.dto.notification.NotificationResponseDto;
import com.snippethub.api.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponseDto<NotificationResponseDto>>> getNotifications(
            @AuthenticationPrincipal UserDetails userDetails,
            Pageable pageable,
            @RequestParam(required = false, defaultValue = "false") boolean unreadOnly) {

        Page<Notification> notificationsPage = notificationService.getNotifications(userDetails.getUsername(), pageable, unreadOnly);
        PageResponseDto<NotificationResponseDto> responseDto = new PageResponseDto<>(
                notificationsPage.map(NotificationResponseDto::new)
        );
        return ResponseEntity.ok(ApiResponse.success(responseDto));
    }

    @GetMapping("/count")
    public ResponseEntity<ApiResponse<Long>> getUnreadNotificationCount(@AuthenticationPrincipal UserDetails userDetails) {
        long count = notificationService.getUnreadNotificationCount(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    @PutMapping("/{notificationId}/read")
    public ResponseEntity<ApiResponse<NotificationResponseDto>> markNotificationAsRead(
            @PathVariable Long notificationId,
            @AuthenticationPrincipal UserDetails userDetails) {

        Notification notification = notificationService.markNotificationAsRead(notificationId, userDetails.getUsername());
        NotificationResponseDto responseDto = new NotificationResponseDto(notification);
        return ResponseEntity.ok(ApiResponse.success("알림이 읽음 처리되었습니다.", responseDto));
    }
}
