package com.snippethub.api.controller;

import com.snippethub.api.domain.NotificationType;
import com.snippethub.api.domain.User;
import com.snippethub.api.dto.NotificationDto;
import com.snippethub.api.repository.UserRepository;
import com.snippethub.api.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import com.snippethub.api.dto.ApiResponse;
import org.springframework.security.access.prepost.PreAuthorize;

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

    /**
     * 테스트용 알림 생성 (개발용)
     */
    @PostMapping("/test")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> createTestNotification(
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            String userEmail = userDetails.getUsername();
            String testMessage = "테스트 알림입니다! " + java.time.LocalDateTime.now();
            
            notificationService.createSimpleNotification(userEmail, testMessage);
            
            return ResponseEntity.ok(ApiResponse.success("테스트 알림이 생성되었습니다.", testMessage));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("테스트 알림 생성 실패: " + e.getMessage()));
        }
    }
}

// 프론트엔드 호환성을 위한 추가 컨트롤러
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
class NotificationControllerV2 {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

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

    // 알림 읽음 처리 (프론트엔드 호환성 - PUT 메서드)
    @PutMapping("/{notificationId}/read")
    public ResponseEntity<Void> markAsReadPut(
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

    // 읽지 않은 알림 개수 조회 (프론트엔드 호환성)
    @GetMapping("/count")
    public ResponseEntity<Long> getUnreadCountV2(@AuthenticationPrincipal UserDetails userDetails) {
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