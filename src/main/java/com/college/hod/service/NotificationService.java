package com.college.hod.service;

import com.college.hod.entity.Notification;
import com.college.hod.entity.User;

import java.util.List;

public interface NotificationService {

    void sendNotification(User user, String message);

    void sendNotification(User user, String message, Long relatedRequestId);

    void sendReminderForRequest(Long requestId);

    List<Notification> getUserNotifications(Long userId);

    List<Notification> getUnreadNotifications(Long userId);

    Notification markAsRead(Long notificationId);
}