package com.college.hod.entity;

import jakarta.persistence.*;
import lombok.*;
import com.college.hod.enums.CertificateStatus;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "certificate")
public class Certificate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Path where certificate file is stored
    @Column(name = "file_path")
    private String filePath;

    @Enumerated(EnumType.STRING)
    private CertificateStatus status;

    // Each certificate belongs to one request
    @OneToOne
    @JoinColumn(name = "request_id")
    private Request request;
}