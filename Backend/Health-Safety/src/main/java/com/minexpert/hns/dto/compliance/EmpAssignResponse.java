package com.minexpert.hns.dto.compliance;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class EmpAssignResponse {
    private String empName;
    private String position;
    private String department;
    private String email;
    private List<ReqResponse> requirements;
}
