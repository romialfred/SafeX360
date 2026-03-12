package com.minexpert.hns.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.entity.incident.Incident;
import com.minexpert.hns.entity.incident.LessonLearned;
import com.minexpert.hns.enums.LessonStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LessonLearnedDTO {
    private Long id;
    private LocalDate date;
    private Long employeeId;
    private String category;
    private LessonStatus status;
    private String description;
    private Long incidentId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public LessonLearned toEntity() {
        return new LessonLearned(id, date, employeeId, category, status, description,
                incidentId != null ? new Incident(incidentId) : null,
                createdAt, updatedAt);
    }
}
