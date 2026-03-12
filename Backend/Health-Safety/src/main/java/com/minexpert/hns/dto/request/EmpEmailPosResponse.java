package com.minexpert.hns.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class EmpEmailPosResponse {
    private Long id;
    private String position;
    private Long positionId;
    private String department;
    private String email;
    private String name;
    private String status;

}
