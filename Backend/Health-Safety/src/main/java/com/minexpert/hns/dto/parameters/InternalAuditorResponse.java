package com.minexpert.hns.dto.parameters;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.enums.Status;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class InternalAuditorResponse {
    private Long id;
    private Long employeeId;
    private Long companyId;
    private String employeeName;
    private String email;
    private String department;
    private String direction;
    private String role;
    private Status status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // ─── LOT 52 — Compétences auditeurs (ISO 19011:2018 §7) ────────────────
    private String qualifications;
    private String domains;
    private String languages;
    private Boolean leadQualified;
    private Long departmentId;
    private LocalDate lastEvaluationDate;
    private Integer lastEvaluationScore;
}
