package com.college.hod.service;

import com.college.hod.entity.Certificate;

public interface CertificateService {

    Certificate uploadCertificate(Long requestId, String filePath);

    Certificate verifyCertificate(Long certificateId);
}