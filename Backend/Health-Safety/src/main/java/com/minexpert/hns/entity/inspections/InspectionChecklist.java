package com.minexpert.hns.entity.inspections;

import java.time.LocalDateTime;

import com.minexpert.hns.dto.inspections.InspectionChecklistDTO;
import com.minexpert.hns.entity.GeneralInspection;
import com.minexpert.hns.entity.parameters.CheckList;

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
public class InspectionChecklist {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "checklist_id", nullable = false)
    private CheckList checkList;
    private String nonConformityLevel;
    private String observation;
    private String docs;
    private String status;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "general_inspection_id", nullable = false)
    private GeneralInspection generalInspection;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public InspectionChecklistDTO toDTO() {
        return new InspectionChecklistDTO(this.id, checkList != null ? this.checkList.getId() : null,
                this.nonConformityLevel,
                this.observation, null, this.status,
                generalInspection != null ? this.generalInspection.getId() : null, this.createdAt, this.updatedAt);
    }

}
