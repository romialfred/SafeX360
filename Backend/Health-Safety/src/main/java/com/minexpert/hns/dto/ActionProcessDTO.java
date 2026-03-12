package com.minexpert.hns.dto;

import java.util.List;

import com.minexpert.hns.entity.incident.ActionProcess;
import com.minexpert.hns.entity.incident.CorrectiveAction;
import com.minexpert.hns.enums.ActionStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ActionProcessDTO {
    private Long id;
    private ActionStatus status;

    private String description;
    private Integer progress;
    private List<MediaDTO> docs;
    private Long correctiveActionId;

    public ActionProcess toEntity() {
        return new ActionProcess(this.id, this.status, this.description, this.progress, null,
                new CorrectiveAction(this.correctiveActionId), null);
    }

}
