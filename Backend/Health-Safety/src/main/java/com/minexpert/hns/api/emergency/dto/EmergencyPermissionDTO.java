package com.minexpert.hns.api.emergency.dto;

import java.time.LocalDateTime;

import com.minexpert.hns.api.emergency.enums.EmergencyPermission;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** DTO d'une permission Emergency (lecture + écriture). */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EmergencyPermissionDTO {
    private Long id;
    private Long userId;
    private EmergencyPermission permission;
    private Long grantedBy;
    private LocalDateTime grantedAt;
    private LocalDateTime revokedAt;
    private Long revokedBy;
    private Long companyId;
    private boolean active;
}
