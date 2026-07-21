package com.minexpert.hns.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class EmployeeNameDTO {
    private Long id;
    private String name;
    private String empNumber;
    /** Téléphone du concerné (console d'intervention SOS). */
    private String phone;
}