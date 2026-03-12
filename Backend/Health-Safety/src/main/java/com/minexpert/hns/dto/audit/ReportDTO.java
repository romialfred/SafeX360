package com.minexpert.hns.dto.audit;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.boot.autoconfigure.session.RedisSessionProperties.RepositoryType;

import com.minexpert.hns.dto.MediaDTO;
import com.minexpert.hns.entity.audit.Audit;
import com.minexpert.hns.entity.audit.Report;
import com.minexpert.hns.enums.AuditReportStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ReportDTO {
    private Long id;
    private String preparerName;
    private String preparerRole;
    private LocalDate preDate;
    private String validatorName;
    private String validatorRole;
    private String validatorStatus;
    private Long auditId;
    private List<MediaDTO> docs;
    private String rejectionComment;
    private String description;
    private AuditReportStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Report toEntity() {
        return new Report(this.id, this.preparerName, this.preparerRole, this.preDate, this.validatorName,
                this.validatorRole, this.validatorStatus, new Audit(this.auditId), null, this.rejectionComment,
                this.description, this.status, this.createdAt, this.updatedAt);
    }
}
