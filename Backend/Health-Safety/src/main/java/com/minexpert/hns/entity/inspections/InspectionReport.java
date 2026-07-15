package com.minexpert.hns.entity.inspections;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.dto.inspections.InspectionReportDTO;
import com.minexpert.hns.entity.GeneralInspection;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.OneToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class InspectionReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long reportedId;
    private LocalDate reportDate;
    @Lob
    private String description;
    private String docs;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "general_inspection_id", nullable = false)
    private GeneralInspection generalInspection;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    /** Mine propriétaire (cloisonnement). Renseigné à la création depuis la requête. */
    private Long companyId;

    public InspectionReportDTO toDTO() {
        return new InspectionReportDTO(id, reportedId, reportDate, description, null,
                generalInspection != null ? generalInspection.getId() : null, createdAt, updatedAt,
                companyId);
    }
}
