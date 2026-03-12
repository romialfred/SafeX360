package com.minexpert.hns.entity.incident;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.dto.InvestigationProcessDTO;
import com.minexpert.hns.enums.ActionStatus;
import com.minexpert.hns.enums.InvestigationStatus;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Entity
public class InvestigationProcess {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private InvestigationStatus status;
    private String description;
    private Integer progress;
    private LocalDate date;
    private String docs;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "investigation_id", nullable = false)
    private Investigation investigation;
    private LocalDateTime createdAt;

    public InvestigationProcessDTO toDTO() {
        return new InvestigationProcessDTO(this.id, this.status, this.description, this.progress, this.date, null,
                this.investigation != null ? this.investigation.getId() : null, this.createdAt);
    }
}
