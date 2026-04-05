package com.college.hod.repository;

import com.college.hod.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId);

    boolean existsByUserIdAndRelatedRequestIdAndCreatedAtBetween(
            Long userId,
            Long relatedRequestId,
            LocalDateTime start,
            LocalDateTime end
    );
}