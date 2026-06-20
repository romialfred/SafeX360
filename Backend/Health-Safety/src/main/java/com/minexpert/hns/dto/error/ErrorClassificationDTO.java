package com.minexpert.hns.dto.error;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.minexpert.hns.entity.error.ErrorClassification;
import com.minexpert.hns.enums.ErrorNature;
import com.minexpert.hns.enums.ViolationSubtype;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ErrorClassificationDTO {
    private Long id;
    private Long errorEventId;
    private ErrorNature errorNature;
    private ViolationSubtype violationSubtype;
    @JsonProperty("isLatent")
    private boolean isLatent;
    private String notes;

    public static ErrorClassificationDTO fromEntity(ErrorClassification c) {
        return new ErrorClassificationDTO(c.getId(), c.getErrorEventId(), c.getErrorNature(),
                c.getViolationSubtype(), c.isLatent(), c.getNotes());
    }
}
