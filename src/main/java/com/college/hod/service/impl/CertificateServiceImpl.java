package com.college.hod.service.impl;

import com.college.hod.entity.Certificate;
import com.college.hod.entity.Request;
import com.college.hod.enums.CertificateStatus;
import com.college.hod.repository.CertificateRepository;
import com.college.hod.repository.RequestRepository;
import com.college.hod.service.CertificateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

@Service
public class CertificateServiceImpl implements CertificateService {

    private static final long MAX_FILE_SIZE = 1 * 1024 * 1024;

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "jpg", "jpeg", "png", "pdf"
    );

    private static final Set<String> CERTIFICATE_REQUIRED_REASONS = Set.of(
            "HACKATHON",
            "SEMINAR",
            "MEDICAL LEAVE",
            "SPORTS EVENT",
            "WORKSHOP / TRAINING",
            "INTERNSHIP"
    );

    @Autowired
    private CertificateRepository certificateRepository;

    @Autowired
    private RequestRepository requestRepository;

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    private Path uploadPath;

    @PostConstruct
    public void init() {
        try {
            uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);
            System.out.println("📁 Upload directory: " + uploadPath);
        } catch (Exception e) {
            throw new RuntimeException("Failed to initialize upload directory", e);
        }
    }

    @Override
    public Certificate uploadCertificate(Long requestId, MultipartFile file) {

        Request request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (request.getStatus() == null || !request.getStatus().name().equals("APPROVED")) {
            throw new RuntimeException("Certificate can be uploaded only for approved requests");
        }

        if (!isCertificateRequired(request.getReason())) {
            throw new RuntimeException("Certificate upload is not allowed for this request reason");
        }

        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Please select a file to upload");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new RuntimeException("File size must not be more than 1 MB");
        }

        String originalFileName = file.getOriginalFilename();
        if (originalFileName == null || originalFileName.isBlank()) {
            throw new RuntimeException("Invalid file name");
        }

        String extension = getFileExtension(originalFileName);
        if (!ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
            throw new RuntimeException("Only JPG, JPEG, PNG, and PDF files are allowed");
        }

        try {
            Certificate cert = certificateRepository.findByRequestId(requestId)
                    .orElseGet(Certificate::new);

            if (cert.getFilePath() != null && !cert.getFilePath().isBlank()) {
                deletePhysicalFile(cert.getFilePath());
            }

            String newFileName = UUID.randomUUID() + "_" + sanitizeFileName(originalFileName);
            Path targetPath = uploadPath.resolve(newFileName);

            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = "/uploads/" + newFileName;

            cert.setFilePath(fileUrl);
            cert.setStatus(CertificateStatus.SUBMITTED);
            cert.setRejectionRemark(null);
            cert.setRejectedAt(null);
            cert.setRequest(request);

            Certificate savedCertificate = certificateRepository.save(cert);

            request.setCertificate(savedCertificate);
            requestRepository.save(request);

            return savedCertificate;

        } catch (IOException e) {
            throw new RuntimeException("Failed to upload certificate file", e);
        }
    }

    @Override
    public Certificate verifyCertificate(Long certificateId) {

        Certificate cert = certificateRepository.findById(certificateId)
                .orElseThrow(() -> new RuntimeException("Certificate not found"));

        cert.setStatus(CertificateStatus.VERIFIED);
        cert.setRejectionRemark(null);
        cert.setRejectedAt(null);

        return certificateRepository.save(cert);
    }

    @Override
    public Certificate rejectCertificate(Long certificateId, String remark) {

        Certificate cert = certificateRepository.findById(certificateId)
                .orElseThrow(() -> new RuntimeException("Certificate not found"));

        if (remark == null || remark.trim().isEmpty()) {
            throw new RuntimeException("Rejection remark is required");
        }

        cert.setStatus(CertificateStatus.REJECTED);
        cert.setRejectionRemark(remark.trim());
        cert.setRejectedAt(LocalDate.now());

        return certificateRepository.save(cert);
    }

    @Override
    public void deleteCertificateByRequestId(Long requestId) {

        Request request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        Certificate cert = certificateRepository.findByRequestId(requestId)
                .orElseThrow(() -> new RuntimeException("Certificate not found for this request"));

        if (cert.getFilePath() != null && !cert.getFilePath().isBlank()) {
            deletePhysicalFile(cert.getFilePath());
        }

        request.setCertificate(null);
        requestRepository.save(request);

        certificateRepository.delete(cert);
    }

    private boolean isCertificateRequired(String reason) {
        return CERTIFICATE_REQUIRED_REASONS.contains(normalizeReason(reason));
    }

    private String normalizeReason(String reason) {
        return String.valueOf(reason == null ? "" : reason)
                .trim()
                .replaceAll("\\s+", " ")
                .toUpperCase();
    }

    private String getFileExtension(String fileName) {
        int lastDotIndex = fileName.lastIndexOf(".");
        if (lastDotIndex == -1 || lastDotIndex == fileName.length() - 1) {
            return "";
        }
        return fileName.substring(lastDotIndex + 1);
    }

    private String sanitizeFileName(String fileName) {
        return fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    private void deletePhysicalFile(String fileUrl) {
        try {
            String fileName = extractFileNameFromUrl(fileUrl);
            if (fileName == null || fileName.isBlank()) return;

            Path filePath = uploadPath.resolve(fileName).normalize();
            Files.deleteIfExists(filePath);

        } catch (Exception e) {
            throw new RuntimeException("Failed to delete old certificate file", e);
        }
    }

    private String extractFileNameFromUrl(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank()) return null;

        if (fileUrl.startsWith("/uploads/")) {
            return fileUrl.substring("/uploads/".length());
        }

        int lastSlash = fileUrl.lastIndexOf("/");
        if (lastSlash >= 0 && lastSlash < fileUrl.length() - 1) {
            return fileUrl.substring(lastSlash + 1);
        }

        return fileUrl;
    }
}
