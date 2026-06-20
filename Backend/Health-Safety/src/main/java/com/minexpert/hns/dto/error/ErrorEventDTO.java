package com.minexpert.hns.dto.error;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.minexpert.hns.entity.error.ErrorEvent;
import com.minexpert.hns.enums.CriticalityLevel;
import com.minexpert.hns.enums.ErrorEventStatus;
import com.minexpert.hns.enums.ErrorSourceModule;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO d'echange (creation / lecture) d'un evenement erreur.
 *
 * Note anonymat : le client positionne {@code isAnonymous}. Si vrai, le service
 * ignore {@code declaredBy}. La reponse ne renvoie jamais {@code declaredBy}
 * lorsque l'evenement est anonyme.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ErrorEventDTO {
    private Long id;
    private String reference;
    private Long companyId;
    private Long eventTypeId;
    private String title;
    private String description;
    private LocalDateTime occurredAt;
    private LocalDateTime declaredAt;
    private Long declaredBy;
    @JsonProperty("isAnonymous")
    private boolean isAnonymous;
    private Long zoneId;
    private Long actualSeverityId;
    private Long potentialSeverityId;
    private Long probabilityId;
    private CriticalityLevel criticalityLevel;
    @JsonProperty("isHipo")
    private boolean isHipo;
    private ErrorEventStatus status;
    private ErrorSourceModule sourceModule;
    private Long linkedIncidentId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Construit une vue DTO a partir de l'entite, en respectant l'anonymat :
     * {@code declaredBy} n'est jamais expose si l'evenement est anonyme.
     */
    public static ErrorEventDTO fromEntity(ErrorEvent e) {
        ErrorEventDTO dto = new ErrorEventDTO();
        dto.setId(e.getId());
        dto.setReference(e.getReference());
        dto.setCompanyId(e.getCompanyId());
        dto.setEventTypeId(e.getEventTypeId());
        dto.setTitle(e.getTitle());
        dto.setDescription(e.getDescription());
        dto.setOccurredAt(e.getOccurredAt());
        dto.setDeclaredAt(e.getDeclaredAt());
        dto.setAnonymous(e.isAnonymous());
        dto.setDeclaredBy(e.isAnonymous() ? null : e.getDeclaredBy());
        dto.setZoneId(e.getZoneId());
        dto.setActualSeverityId(e.getActualSeverityId());
        dto.setPotentialSeverityId(e.getPotentialSeverityId());
        dto.setProbabilityId(e.getProbabilityId());
        dto.setCriticalityLevel(e.getCriticalityLevel());
        dto.setHipo(e.isHipo());
        dto.setStatus(e.getStatus());
        dto.setSourceModule(e.getSourceModule());
        dto.setLinkedIncidentId(e.getLinkedIncidentId());
        dto.setCreatedAt(e.getCreatedAt());
        dto.setUpdatedAt(e.getUpdatedAt());
        return dto;
    }
}
