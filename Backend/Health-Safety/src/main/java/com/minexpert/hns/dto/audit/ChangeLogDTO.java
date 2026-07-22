package com.minexpert.hns.dto.audit;

import java.time.LocalDateTime;

import com.minexpert.hns.entity.audit.ChangeLog;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChangeLogDTO {
    private Long id;
    private String entityType;
    private Long entityId;
    private String field;
    private String oldValue;
    private String newValue;
    private Long actorId;
    /** Nom de l'acteur, résolu via HRMS (null si non résolu / système). */
    private String actorName;
    private LocalDateTime changedAt;

    public static ChangeLogDTO fromEntity(ChangeLog c) {
        return new ChangeLogDTO(c.getId(), c.getEntityType(), c.getEntityId(), c.getField(),
                c.getOldValue(), c.getNewValue(), c.getActorId(), null, c.getChangedAt());
    }
}
