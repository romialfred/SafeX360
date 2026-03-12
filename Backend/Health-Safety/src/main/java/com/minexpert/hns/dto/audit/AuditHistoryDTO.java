package com.minexpert.hns.dto.audit;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.entity.audit.Audit;
import com.minexpert.hns.entity.audit.AuditHistory;
import com.minexpert.hns.enums.AuditStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuditHistoryDTO {
    private Long id;
    private Long ownerId;
    private LocalDate date;
    private AuditStatus status;
    private String comment;
    private String closingReport;
    private String lessonLearned;
    private Integer rating;
    private Long auditId;
    private LocalDateTime createdAt;

    public AuditHistory toEntity() {
        return new AuditHistory(id, ownerId, date, status, comment, closingReport, lessonLearned, rating,
                auditId != null ? new Audit(auditId) : null, createdAt);
    }
}
