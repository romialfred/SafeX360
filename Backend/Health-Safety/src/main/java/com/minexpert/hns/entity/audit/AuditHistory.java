package com.minexpert.hns.entity.audit;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.dto.audit.AuditHistoryDTO;
import com.minexpert.hns.entity.incident.Incident;
import com.minexpert.hns.enums.AuditStatus;
import com.minexpert.hns.enums.IncidentStatus;

import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
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

@Data
@Entity
@AllArgsConstructor
@NoArgsConstructor
public class AuditHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long ownerId;
    private LocalDate date;
    @Enumerated(EnumType.STRING)
    private AuditStatus status;
    private String comment;
    @Lob
    private String closingReport;
    @Lob
    private String lessonLearned;
    private Integer rating;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audit_id", nullable = false)
    private Audit audit;
    private LocalDateTime createdAt;

    public AuditHistoryDTO toDTO() {
        return new AuditHistoryDTO(id, ownerId, date, status, comment, closingReport, lessonLearned, rating,
                audit != null ? audit.getId() : null, createdAt);
    }
}
