package com.minexpert.hns.entity.inspections;

import java.time.LocalDateTime;

import com.minexpert.hns.dto.inspections.InspectionMeasurementDTO;
import com.minexpert.hns.entity.GeneralInspection;
import com.minexpert.hns.entity.parameters.CheckList;
import com.minexpert.hns.entity.parameters.Measurement;

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
public class InspectionMeasurement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "measurement_id", nullable = false)
    private Measurement measurement;
    private Double value;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "general_inspection_id", nullable = false)
    private GeneralInspection generalInspection;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    /** Mine propriétaire (cloisonnement). Renseigné à la création depuis la requête. */
    private Long companyId;

    public InspectionMeasurementDTO toDTO() {
        return new InspectionMeasurementDTO(this.id, measurement != null ? this.measurement.getId() : null,
                this.value, generalInspection != null ? this.generalInspection.getId() : null,
                this.createdAt, this.updatedAt, this.companyId);
    }
}
