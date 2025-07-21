package com.snippethub.api.repository;

import com.snippethub.api.domain.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    Page<Notification> findByUserId(Long userId, Pageable pageable);
    Page<Notification> findByUserIdAndIsRead(Long userId, boolean isRead, Pageable pageable);
    long countByUserIdAndIsRead(Long userId, boolean isRead);
}
