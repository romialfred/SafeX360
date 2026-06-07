package com.minexpert.hns.dosimetry.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DosimetryAuditLogDTO {

    private Long id;

    @NotBlank
    private String action;

    @NotBlank
    private String entityType;

    private Long entityId;

    @NotNull
    private Long userId;

    private String userPermissions;

    private LocalDateTime timestamp;

    private String ipAddress;
    private String details;
}
