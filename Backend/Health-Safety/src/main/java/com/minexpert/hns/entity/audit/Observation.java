package com.minexpert.hns.entity.audit;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import com.minexpert.hns.dto.audit.ObservationDTO;
import com.minexpert.hns.entity.parameters.AuditAreas;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "audit_observations")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Observation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private LocalDate date;
    @Lob
    private String observedFact;
    private String reference;
    private String type;
    private Integer severity;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "zone_id", nullable = false)
    private AuditAreas zone;
    @Lob
    private String description;
    private String evidence;

    @Column(columnDefinition = "json")
    @Convert(converter = EmpInterviewConverter.class)
    private List<EmpInterview> interviews;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audit_id", nullable = false)
    private Audit audit;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Observation(Long id) {
        this.id = id;
    }

    public ObservationDTO toDTO() {
        return new ObservationDTO(id, title, date, observedFact, reference, type, severity,
                zone != null ? zone.getId() : null,
                description, null, interviews, audit != null ? audit.getId() : null, createdAt, updatedAt);
    }

}
