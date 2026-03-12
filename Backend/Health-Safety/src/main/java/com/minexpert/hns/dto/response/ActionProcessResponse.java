package com.minexpert.hns.dto.response;

import java.time.LocalDateTime;
import java.util.List;

import com.minexpert.hns.dto.MediaDTO;
import com.minexpert.hns.enums.ActionStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ActionProcessResponse {
    private Long id;
    private ActionStatus status;
    private String description;
    private Integer progress;
    private List<MediaDTO> docs;
    private Long correctiveActionId;
    private LocalDateTime createdAt;
}
