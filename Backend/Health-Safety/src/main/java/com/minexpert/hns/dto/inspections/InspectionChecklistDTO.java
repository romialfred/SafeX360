package com.minexpert.hns.dto.inspections;

import java.time.LocalDateTime;
import java.util.List;

import com.minexpert.hns.dto.MediaDTO;
import com.minexpert.hns.entity.GeneralInspection;
import com.minexpert.hns.entity.inspections.InspectionChecklist;
import com.minexpert.hns.entity.parameters.CheckList;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class InspectionChecklistDTO {
    private Long id;
    private Long checkListId;
    private String nonConformityLevel;
    private String observation;
    private List<MediaDTO> docs;
    private String status;
    private Long generalInspectionId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long companyId;

    public InspectionChecklist toEntity() {
        return new InspectionChecklist(this.id, new CheckList(this.checkListId), this.nonConformityLevel,
                this.observation, null, this.status,
                new GeneralInspection(this.generalInspectionId), this.createdAt, this.updatedAt,
                this.companyId);
    }
}
