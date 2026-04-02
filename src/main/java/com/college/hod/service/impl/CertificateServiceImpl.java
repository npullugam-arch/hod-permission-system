package com.college.hod.service.impl;

import com.college.hod.entity.Certificate;
import com.college.hod.entity.Request;
import com.college.hod.enums.CertificateStatus;
import com.college.hod.repository.CertificateRepository;
import com.college.hod.repository.RequestRepository;
import com.college.hod.service.CertificateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class CertificateServiceImpl implements CertificateService {

    @Autowired
    private CertificateRepository certificateRepository;

    @Autowired
    private RequestRepository requestRepository;

    @Override
    public Certificate uploadCertificate(Long requestId, String filePath) {

        Request request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        Certificate cert = new Certificate();
        cert.setFilePath(filePath);
        cert.setStatus(CertificateStatus.SUBMITTED);
        cert.setRequest(request);

        return certificateRepository.save(cert);
    }

    @Override
    public Certificate verifyCertificate(Long certificateId) {

        Certificate cert = certificateRepository.findById(certificateId)
                .orElseThrow(() -> new RuntimeException("Certificate not found"));

        cert.setStatus(CertificateStatus.VERIFIED);

        return certificateRepository.save(cert);
    }
}