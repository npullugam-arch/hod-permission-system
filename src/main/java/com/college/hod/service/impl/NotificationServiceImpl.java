package com.college.hod.service.impl;

import com.college.hod.entity.Notification;
import com.college.hod.entity.Request;
import com.college.hod.entity.Student;
import com.college.hod.entity.User;
import com.college.hod.enums.RequestStatus;
import com.college.hod.repository.NotificationRepository;
import com.college.hod.repository.RequestRepository;
import com.college.hod.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.Nullable;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

@Service
public class NotificationServiceImpl implements NotificationService {

    private static final Set<String> CERTIFICATE_REQUIRED_REASONS = Set.of(
            "HACKATHON",
            "SEMINAR",
            "MEDICAL LEAVE",
            "SPORTS EVENT",
            "WORKSHOP / TRAINING",
            "INTERNSHIP"
    );

    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private RequestRepository requestRepository;

    // 🔥 Make this optional → prevents crash
    @Autowired(required = false)
    @Nullable
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    @Override
    public void sendNotification(User user, String message) {
        sendNotification(user, message, null);
    }

    @Override
    public void sendNotification(User user, String message, Long relatedRequestId) {

        Notification notification = new Notification();
        notification.setUser(user);
        notification.setMessage(message.trim());
        notification.setRead(false);
        notification.setCreatedAt(LocalDateTime.now());
        notification.setRelatedRequestId(relatedRequestId);

        notificationRepository.save(notification);
    }

    @Override
    public void sendReminderForRequest(Long requestId) {

        Request request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        LocalDate today = LocalDate.now();

        if (request.getStatus() != RequestStatus.APPROVED) {
            throw new RuntimeException("Reminder only for approved requests");
        }

        if (!isCertificateRequired(request.getReason())) {
            throw new RuntimeException("Certificate not required");
        }

        if (request.getCertificate() != null &&
                request.getCertificate().getFilePath() != null &&
                !request.getCertificate().getFilePath().isBlank()) {
            throw new RuntimeException("Certificate already submitted");
        }

        if (today.isBefore(request.getEndDate())) {
            throw new RuntimeException("Reminder only after event end");
        }

        if (today.isAfter(request.getCertificateDueDate())) {
            throw new RuntimeException("Deadline crossed");
        }

        Student student = request.getStudent();
        User user = student.getUser();

        String email = getStudentEmail(student, user);

        // 🔥 Send email ONLY if mailSender exists
        if (mailSender != null && email != null && isValidEmail(email)) {
            sendEmail(email,
                    "Reminder for Certificate",
                    "Please upload your certificate before " + request.getCertificateDueDate());
        } else {
            System.out.println("⚠ Email skipped (mail not configured)");
        }

        sendNotification(user,
                "Reminder: Upload certificate before " + request.getCertificateDueDate(),
                request.getId());
    }

    @Override
    public List<Notification> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Override
    public List<Notification> getUnreadNotifications(Long userId) {
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
    }

    @Override
    public Notification markAsRead(Long id) {
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Not found"));
        n.setRead(true);
        return notificationRepository.save(n);
    }

    private void sendEmail(String to, String subject, String body) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(fromEmail);
            msg.setTo(to);
            msg.setSubject(subject);
            msg.setText(body);

            mailSender.send(msg);

        } catch (Exception e) {
            System.out.println("⚠ Email failed: " + e.getMessage());
        }
    }

    private String getStudentEmail(Student s, User u) {
        if (s.getEmail() != null && !s.getEmail().isBlank()) return s.getEmail();
        if (u.getEmail() != null && !u.getEmail().isBlank()) return u.getEmail();
        return null;
    }

    private boolean isValidEmail(String email) {
        return EMAIL_PATTERN.matcher(email).matches();
    }

    private boolean isCertificateRequired(String reason) {
        return CERTIFICATE_REQUIRED_REASONS.contains(
                String.valueOf(reason).trim().toUpperCase()
        );
    }
}
