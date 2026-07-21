package com.hrms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmergencyContactDTO {
    private Long id;
    private Long employeeId;
    private String name;
    private String relationship;
    private String phone;
    private String altPhone;
    private String email;
    private Integer priority;
    private String note;
}
