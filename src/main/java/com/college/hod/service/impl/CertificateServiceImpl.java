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

import java.io.IOException;
import java.nio.file.*;
import java.util.Set;
import java.util.UUID;

@Service
public class CertificateServiceImpl implements CertificateService {

    @Autowired
    private CertificateRepository certificateRepository;

    @Autowired
    private RequestRepository requestRepository;

    @Value("${file.upload-dir}")
    private String uploadDir;

    private static final long MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "jpg", "jpeg", "png", "pdf"
    );

    @Override
    public Certificate uploadCertificate(Long requestId, MultipartFile file) {

        Request request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (request.getStatus() == null || !request.getStatus().name().equals("APPROVED")) {
            throw new RuntimeException("Certificate can be uploaded only for approved requests");
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
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);

            String newFileName = UUID.randomUUID() + "_" + sanitizeFileName(originalFileName);
            Path targetPath = uploadPath.resolve(newFileName);

            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            Certificate cert = certificateRepository.findByRequestId(requestId)
                    .orElseGet(Certificate::new);

            // URL that frontend and HOD can open in browser
            String fileUrl = "/uploads/" + newFileName;

            cert.setFilePath(fileUrl);
            cert.setStatus(CertificateStatus.SUBMITTED);
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

        return certificateRepository.save(cert);
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
}