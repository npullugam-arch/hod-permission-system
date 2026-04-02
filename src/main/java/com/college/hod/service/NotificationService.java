package com.college.hod.service;

import com.college.hod.entity.Notification;
import com.college.hod.entity.User;

import java.util.List;

public interface NotificationService {

    void sendNotification(User user, String message);

    List<Notification> getUserNotifications(Long userId);
}