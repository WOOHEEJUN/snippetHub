package com.snippethub.api.controller;

import com.snippethub.api.dto.NotificationDto;
import com.snippethub.api.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    // 내 알림 목록 조회
    @GetMapping
    public ResponseEntity<List<NotificationDto>> getMyNotifications(@AuthenticationPrincipal UserDetails userDetails) {
        List<NotificationDto> notifications = notificationService.getMyNotifications(userDetails.getUsername());
        return ResponseEntity.ok(notifications);
    }

    // 알림 읽음 처리
    @PostMapping("/{notificationId}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable Long notificationId,
            @AuthenticationPrincipal UserDetails userDetails) {
        notificationService.markAsRead(notificationId, userDetails.getUsername());
        return ResponseEntity.ok().build();
    }
}

// 프론트엔드 호환성을 위한 추가 컨트롤러
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
class NotificationControllerV2 {

    private final NotificationService notificationService;

    // 내 알림 목록 조회 (프론트엔드 호환성)
    @GetMapping
    public ResponseEntity<List<NotificationDto>> getMyNotifications(@AuthenticationPrincipal UserDetails userDetails) {
        List<NotificationDto> notifications = notificationService.getMyNotifications(userDetails.getUsername());
        return ResponseEntity.ok(notifications);
    }

    // 알림 읽음 처리 (프론트엔드 호환성)
    @PostMapping("/{notificationId}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable Long notificationId,
            @AuthenticationPrincipal UserDetails userDetails) {
        notificationService.markAsRead(notificationId, userDetails.getUsername());
        return ResponseEntity.ok().build();
    }

    // 읽지 않은 알림 개수 조회
    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount(@AuthenticationPrincipal UserDetails userDetails) {
        Long unreadCount = notificationService.getUnreadCount(userDetails.getUsername());
        return ResponseEntity.ok(unreadCount);
    }

    // 모든 알림 읽음 처리
    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(@AuthenticationPrincipal UserDetails userDetails) {
        notificationService.markAllAsRead(userDetails.getUsername());
        return ResponseEntity.ok().build();
    }
}