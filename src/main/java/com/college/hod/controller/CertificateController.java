package com.college.hod.controller;

import com.college.hod.entity.Certificate;
import com.college.hod.service.CertificateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/certificate")
@CrossOrigin("*")
public class CertificateController {

    @Autowired
    private CertificateService certificateService;

    // Upload certificate
    @PostMapping("/upload")
    public Certificate uploadCertificate(@RequestParam Long requestId,
                                         @RequestParam String filePath) {

        return certificateService.uploadCertificate(requestId, filePath);
    }

    // Verify certificate
    @PostMapping("/verify/{id}")
    public Certificate verifyCertificate(@PathVariable Long id) {
        return certificateService.verifyCertificate(id);
    }
}