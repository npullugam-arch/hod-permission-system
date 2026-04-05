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

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Override
    public void sendNotification(User user, String message) {
        sendNotification(user, message, null);
    }

    @Override
    public void sendNotification(User user, String message, Long relatedRequestId) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setMessage(message != null ? message.trim() : "");
        notification.setRead(false);
        notification.setCreatedAt(LocalDateTime.now());
        notification.setRelatedRequestId(relatedRequestId);

        notificationRepository.save(notification);
    }

    @Override
    public void sendReminderForRequest(Long requestId) {
        Request request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found with id: " + requestId));

        LocalDate today = LocalDate.now();

        if (request.getStatus() != RequestStatus.APPROVED) {
            throw new RuntimeException("Reminder can be sent only for approved requests");
        }

        if (!isCertificateRequired(request.getReason())) {
            throw new RuntimeException("Certificate is not required for this request");
        }

        if (request.getCertificate() != null &&
                request.getCertificate().getFilePath() != null &&
                !request.getCertificate().getFilePath().isBlank()) {
            throw new RuntimeException("Certificate already submitted");
        }

        if (request.getEndDate() == null) {
            throw new RuntimeException("Request end date is missing");
        }

        if (request.getCertificateDueDate() == null) {
            throw new RuntimeException("Certificate due date is missing");
        }

        if (today.isBefore(request.getEndDate())) {
            throw new RuntimeException("Reminder can be sent only after event end date");
        }

        if (today.isAfter(request.getCertificateDueDate())) {
            throw new RuntimeException("Certificate submission deadline has already passed");
        }

        Student student = request.getStudent();
        if (student == null) {
            throw new RuntimeException("Student not found for this request");
        }

        User user = student.getUser();
        if (user == null) {
            throw new RuntimeException("User not found for this student");
        }

        String email = getStudentEmail(student, user);

        if (email == null || email.isBlank()) {
            throw new RuntimeException("Student email not found");
        }

        if (!isValidEmail(email)) {
            throw new RuntimeException("Invalid student email: " + email);
        }

        String subject = "Reminder for Certificate Submission";
        String body = buildReminderMessage(student, request);

        sendEmail(email, subject, body);

        sendNotification(
                user,
                "Reminder: Upload certificate before " + request.getCertificateDueDate(),
                request.getId()
        );
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
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found with id: " + id));

        notification.setRead(true);
        return notificationRepository.save(notification);
    }

    private void sendEmail(String to, String subject, String body) {
        try {
            if (fromEmail == null || fromEmail.isBlank()) {
                throw new RuntimeException("spring.mail.username is missing in application.properties");
            }

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);

            mailSender.send(message);

            System.out.println("✅ Email sent successfully to: " + to);

        } catch (Exception e) {
            System.out.println("❌ Email sending failed: " + e.getMessage());
            throw new RuntimeException("Failed to send email to " + to + ": " + e.getMessage(), e);
        }
    }

    private String getStudentEmail(Student student, User user) {
        if (student.getEmail() != null && !student.getEmail().isBlank()) {
            return student.getEmail().trim();
        }

        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            return user.getEmail().trim();
        }

        return null;
    }

    private boolean isValidEmail(String email) {
        return EMAIL_PATTERN.matcher(email).matches();
    }

    private boolean isCertificateRequired(String reason) {
        if (reason == null) {
            return false;
        }
        return CERTIFICATE_REQUIRED_REASONS.contains(reason.trim().toUpperCase());
    }

    private String buildReminderMessage(Student student, Request request) {
        String studentName = student.getName() != null ? student.getName() : "Student";

        return "Hello " + studentName + ",\n\n"
                + "This is a reminder to upload your certificate for your approved request.\n\n"
                + "Reason/Event: " + request.getReason() + "\n"
                + "End Date: " + request.getEndDate() + "\n"
                + "Certificate Due Date: " + request.getCertificateDueDate() + "\n\n"
                + "Please upload the certificate before the deadline.\n\n"
                + "Regards,\n"
                + "HOD Permission System";
    }
}
