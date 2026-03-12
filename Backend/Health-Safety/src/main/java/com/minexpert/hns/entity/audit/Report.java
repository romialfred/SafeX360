package com.minexpert.hns.entity.audit;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import com.minexpert.hns.dto.audit.ReportDTO;
import com.minexpert.hns.enums.AuditReportStatus;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Report {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String preparerName;
    private String preparerRole;
    private LocalDate preDate;
    private String validatorName;
    private String validatorRole;
    private String validatorStatus;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audit_id", nullable = false)
    private Audit audit;
    private String docs;
    private String rejectionComment;
    @Lob
    private String description;
    private AuditReportStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Report(Long id) {
        this.id = id;
    }

    public ReportDTO toDTO() {
        return new ReportDTO(this.id, this.preparerName, this.preparerRole, this.preDate, this.validatorName,
                this.validatorRole, this.validatorStatus, this.audit != null ? this.audit.getId() : null,
                null, this.rejectionComment, this.description, this.status, this.createdAt, this.updatedAt);
    }
}
