package com.minexpert.hns.entity.compliance;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.entity.Media;
import com.minexpert.hns.enums.DocStatus;

import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class ComplianceDocs {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "media_id", nullable = false)
    private Media media;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requirement_id", nullable = false)
    private Requirement requirement;
    private Long employeeId;
    private LocalDate expiryDate;
    private String comment;
    @Enumerated(EnumType.STRING)
    private DocStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
