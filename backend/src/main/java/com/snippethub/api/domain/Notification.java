package com.snippethub.api.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notification_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, referencedColumnName = "user_id")
    private User user;

    @Column(nullable = false)
    private String message;

    @Column(nullable = false)
    private Boolean isRead;

    @Enumerated(EnumType.STRING)
    @Column(name = "notification_type")
    private NotificationType notificationType;

    @Column(name = "target_type")
    private String targetType; // POST, SNIPPET, COMMENT 등

    @Column(name = "target_id")
    private Long targetId; // 대상 ID

    @Column(name = "parent_id")
    private Long parentId; // 부모 ID (댓글의 경우 게시글 ID)

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}