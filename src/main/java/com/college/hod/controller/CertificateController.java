package com.college.hod.controller;

import com.college.hod.entity.Certificate;
import com.college.hod.service.CertificateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/certificate")
@CrossOrigin("*")
public class CertificateController {

    @Autowired
    private CertificateService certificateService;

    // Upload certificate file
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Certificate uploadCertificate(@RequestParam Long requestId,
                                         @RequestParam("file") MultipartFile file) {

        return certificateService.uploadCertificate(requestId, file);
    }

    // Verify certificate
    @PostMapping("/verify/{id}")
    public Certificate verifyCertificate(@PathVariable Long id) {
        return certificateService.verifyCertificate(id);
    }
}