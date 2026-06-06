package com.minexpert.hns.api.emergency.dto;

import com.minexpert.hns.api.emergency.enums.EmergencyPermission;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EscalationRuleDTO {
    private Long id;
    private Long companyId;
    private String name;
    private String description;
    private Integer stepOrder;
    private Long targetUserId;
    private EmergencyPermission targetPermission;
    private Integer delaySeconds;
    private String status;
}
