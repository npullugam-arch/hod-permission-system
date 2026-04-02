package com.college.hod.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class RequestDTO {

    private String reason;
    private String description;

    private LocalDate startDate;
    private LocalDate endDate;

    private Long studentId;
}