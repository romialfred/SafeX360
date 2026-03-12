package com.minexpert.hns.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import com.minexpert.hns.entity.incident.Investigation;
import com.minexpert.hns.entity.incident.InvestigationProcess;
import com.minexpert.hns.enums.ActionStatus;
import com.minexpert.hns.enums.InvestigationStatus;

import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class InvestigationProcessDTO {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private InvestigationStatus status;
    private String description;
    private Integer progress;
    private LocalDate date;
    private List<MediaDTO> docs;
    private Long investigationId;
    private LocalDateTime createdAt;

    public InvestigationProcess toEntity() {
        return new InvestigationProcess(id, status, description, progress, date, null,
                new Investigation(investigationId), createdAt);
    }
}
