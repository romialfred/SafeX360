package com.minexpert.hns.dto;

import java.time.LocalDate;

import com.minexpert.hns.enums.LessonStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LessonLearnedDetails {
    private Long id;
    private String category;
    private String description;
    private LessonStatus status;
    private Long incidentId;
    private String incidentTitle;
    private String employeeName;
    private Long employeeId;
    private LocalDate date;

}
