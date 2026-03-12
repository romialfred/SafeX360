package com.minexpert.hns.entity.nonConformity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.dto.nonConformity.NcHistoryDTO;
import com.minexpert.hns.entity.incident.Incident;
import com.minexpert.hns.enums.EventStatus;
import com.minexpert.hns.enums.IncidentStatus;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class NcHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long ownerId;
    private LocalDate date;
    @Enumerated(EnumType.STRING)
    private EventStatus status;
    private String comment;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "non_conformity_id", nullable = false)
    private NonConformity nonConformity;
    private LocalDateTime createdAt;

    public NcHistoryDTO toDTO() {
        return new NcHistoryDTO(id, ownerId, date, status, comment,
                nonConformity != null ? nonConformity.getId() : null, createdAt);
    }
}
