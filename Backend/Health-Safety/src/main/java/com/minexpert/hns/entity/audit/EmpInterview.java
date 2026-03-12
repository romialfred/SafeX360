package com.minexpert.hns.entity.audit;

import java.io.Serializable;
import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class EmpInterview implements Serializable {
    private Long id;
    private String name;
    private LocalDate date;
}
