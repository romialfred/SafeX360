package com.minexpert.hns.dto.audit;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import com.minexpert.hns.dto.MediaDTO;
import com.minexpert.hns.entity.audit.Audit;
import com.minexpert.hns.entity.audit.EmpInterview;
import com.minexpert.hns.entity.audit.EmpInterviewConverter;
import com.minexpert.hns.entity.audit.Observation;
import com.minexpert.hns.entity.parameters.AuditAreas;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ObservationDTO {
    private Long id;
    private String title;
    private LocalDate date;
    private String observedFact;
    private String reference;
    private String type;
    private Integer severity;
    private Long zoneId;
    private String description;
    private List<MediaDTO> evidence;

    private List<EmpInterview> interviews;
    private Long auditId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** LOT 52 — classification ISO : NC_MAJEURE / NC_MINEURE / OBSERVATION / OPPORTUNITE. */
    private String classification;

    /** LOT 52 — clause du référentiel concernée. */
    private String clause;

    /** LOT 52 — id de la NonConformity centrale créée par escalade (lecture seule). */
    private Long nonConformityId;

    public Observation toEntity() {
        return new Observation(id, title, date, observedFact, reference, type, severity, new AuditAreas(zoneId),
                description,
                null, interviews, new Audit(auditId), createdAt, updatedAt,
                classification, clause, nonConformityId);
    }
}
