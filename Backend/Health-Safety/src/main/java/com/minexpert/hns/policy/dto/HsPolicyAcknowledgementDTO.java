package com.minexpert.hns.policy.dto;

import java.time.LocalDateTime;

import com.minexpert.hns.policy.entity.HsPolicyAcknowledgement;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class HsPolicyAcknowledgementDTO {
    private Long id;
    private Long accountId;
    private Long empId;
    private String name;
    private LocalDateTime acknowledgedAt;

    public static HsPolicyAcknowledgementDTO fromEntity(HsPolicyAcknowledgement a) {
        return new HsPolicyAcknowledgementDTO(a.getId(), a.getAccountId(), a.getEmpId(),
                a.getName(), a.getAcknowledgedAt());
    }
}
