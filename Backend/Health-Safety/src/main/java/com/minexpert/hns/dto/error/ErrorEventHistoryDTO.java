package com.minexpert.hns.dto.error;

import java.time.LocalDateTime;

import com.minexpert.hns.entity.error.ErrorEventHistory;
import com.minexpert.hns.enums.ErrorEventStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ErrorEventHistoryDTO {
    private Long id;
    private Long errorEventId;
    private ErrorEventStatus fromStatus;
    private ErrorEventStatus toStatus;
    private String action;
    private Long actorId;
    private String actorLabel;
    private String comment;
    private LocalDateTime timestamp;

    public static ErrorEventHistoryDTO fromEntity(ErrorEventHistory h) {
        return new ErrorEventHistoryDTO(h.getId(), h.getErrorEventId(), h.getFromStatus(), h.getToStatus(),
                h.getAction(), h.getActorId(), h.getActorLabel(), h.getComment(), h.getTimestamp());
    }
}
