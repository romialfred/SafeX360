package com.minexpert.hns.entity.inspections;

import java.time.LocalDateTime;

import com.minexpert.hns.dto.inspections.InspectionInterviewsDTO;
import com.minexpert.hns.entity.GeneralInspection;
import com.minexpert.hns.entity.parameters.Measurement;
import com.minexpert.hns.utility.StringListConverter;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class InspectionInterviews {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String employees;
    private LocalDateTime interviewDate;
    private String description;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "general_inspection_id", nullable = false)
    private GeneralInspection generalInspection;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    /** Mine propriétaire (cloisonnement). Renseigné à la création depuis la requête. */
    private Long companyId;

    public InspectionInterviewsDTO toDTO() {
        return new InspectionInterviewsDTO(this.id, StringListConverter.convertToLongList(employees),
                this.interviewDate, this.description,
                generalInspection != null ? this.generalInspection.getId() : null, this.createdAt, this.updatedAt,
                this.companyId);
    }
}
