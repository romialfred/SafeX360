package com.minexpert.hns.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class EmployeeDirection {
    private Long id;
    private String name;
    private String department;
    private String email;
    private String direction;

}
