package com.minexpert.hns.dto.compliance;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.dto.MediaDTO;
import com.minexpert.hns.entity.Media;
import com.minexpert.hns.entity.compliance.MandatoryInspection;
import com.minexpert.hns.enums.Status;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class MandatoryInspectionDTO {

    private Long id;
    private Long companyId;
    private String equipmentType;
    private String equipmentRef;
    private String title;
    private String inspectionType;
    private String inspectionBody;
    private Integer frequencyMonths;
    private LocalDate lastInspectionDate;
    private LocalDate nextInspectionDate;
    private String result;
    private String certificateNumber;
    private Long responsibleEmployeeId;

    private Long mediaId;
    private String mediaName;
    private MediaDTO media;

    private String notes;
    private Status status;

    private String conformity;
    private Long daysToNext;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public MandatoryInspection toEntity() {
        MandatoryInspection e = new MandatoryInspection();
        e.setId(id);
        e.setCompanyId(companyId);
        e.setEquipmentType(equipmentType);
        e.setEquipmentRef(equipmentRef);
        e.setTitle(title);
        e.setInspectionType(inspectionType);
        e.setInspectionBody(inspectionBody);
        e.setFrequencyMonths(frequencyMonths);
        e.setLastInspectionDate(lastInspectionDate);
        e.setNextInspectionDate(nextInspectionDate);
        e.setResult(result);
        e.setCertificateNumber(certificateNumber);
        e.setResponsibleEmployeeId(responsibleEmployeeId);
        e.setNotes(notes);
        e.setStatus(status);
        e.setCreatedAt(createdAt);
        e.setUpdatedAt(updatedAt);
        if (mediaId != null) {
            Media m = new Media();
            m.setId(mediaId);
            e.setMedia(m);
        }
        return e;
    }
}
