package com.minexpert.hns.blast.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlastRecipientDTO {

    private Long id;
    private Long employeeId;
    private String externalEmail;
    /** {@code FR} ou {@code EN}. */
    private String preferredLanguage;
}
