package com.college.hod.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import com.college.hod.enums.RequestStatus;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "request")
public class Request {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String reason;
    private String description;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "request_date")
    private LocalDate requestDate;

    @Column(name = "approval_date")
    private LocalDate approvalDate;

    @Column(name = "certificate_due_date")
    private LocalDate certificateDueDate;

    @Enumerated(EnumType.STRING)
    private RequestStatus status;

    @ManyToOne
    @JoinColumn(name = "student_id")
    private Student student;

    @ManyToOne
    @JoinColumn(name = "hod_id")
    private User hod;

    @OneToOne(mappedBy = "request")
    private Certificate certificate;
}