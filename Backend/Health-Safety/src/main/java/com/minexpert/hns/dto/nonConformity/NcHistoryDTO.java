package com.minexpert.hns.dto.nonConformity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.minexpert.hns.entity.nonConformity.NcHistory;
import com.minexpert.hns.entity.nonConformity.NonConformity;
import com.minexpert.hns.enums.EventStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class NcHistoryDTO {
    private Long id;
    private Long ownerId;
    private LocalDate date;
    private EventStatus status;
    private String comment;
    private Long nonConformityId;;
    private LocalDateTime createdAt;

    public NcHistory toEntity() {
        return new NcHistory(id, ownerId, date, status, comment,
                nonConformityId != null ? new NonConformity(nonConformityId) : null,
                createdAt);
    }
}
