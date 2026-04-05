package com.college.hod.controller;

import com.college.hod.entity.Notification;
import com.college.hod.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/notification")
@CrossOrigin("*")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping("/{userId}")
    public List<Notification> getNotifications(@PathVariable Long userId) {
        return notificationService.getUserNotifications(userId);
    }

    @GetMapping("/unread/{userId}")
    public List<Notification> getUnreadNotifications(@PathVariable Long userId) {
        return notificationService.getUnreadNotifications(userId);
    }

    @RequestMapping(value = "/send-reminder/{requestId}", method = {RequestMethod.POST, RequestMethod.GET})
    public ResponseEntity<String> sendReminder(@PathVariable Long requestId) {
        notificationService.sendReminderForRequest(requestId);
        return ResponseEntity.ok("Reminder sent successfully");
    }

    @PutMapping("/read/{notificationId}")
    public Notification markAsRead(@PathVariable Long notificationId) {
        return notificationService.markAsRead(notificationId);
    }
}
