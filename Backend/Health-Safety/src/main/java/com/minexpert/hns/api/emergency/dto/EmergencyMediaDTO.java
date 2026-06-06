package com.minexpert.hns.api.emergency.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EmergencyMediaDTO {
    private Long id;
    private Long companyId;
    private String mediaType; // SIREN | VOICE_MESSAGE
    private String locale;
    private String label;
    private String filePath;
    private String ttsText;
    private Boolean isDefault;
    private String status;
}
