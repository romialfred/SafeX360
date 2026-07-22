package com.minexpert.hns.dto;

import java.time.LocalDateTime;

import com.minexpert.hns.entity.incident.InvestigationTimelineEvent;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class InvestigationTimelineEventDTO {
    private Long id;
    private Long investigationId;
    private LocalDateTime occurredAt;
    private Integer sequenceOrder;
    private String eventType;
    private String description;
    private Boolean barrierFailed;

    public static InvestigationTimelineEventDTO fromEntity(InvestigationTimelineEvent e) {
        return new InvestigationTimelineEventDTO(e.getId(), e.getInvestigationId(), e.getOccurredAt(),
                e.getSequenceOrder(), e.getEventType(), e.getDescription(), e.getBarrierFailed());
    }
}
