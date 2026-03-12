package com.minexpert.hns.dto.audit;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import com.minexpert.hns.entity.audit.Audit;
import com.minexpert.hns.entity.audit.Meeting;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MeetingDTO {
    private Long id;
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
    private String agenda;
    private String minutes;
    private Long auditId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Meeting toEntity() {
        return new Meeting(this.id, this.date, this.startTime, this.endTime, this.agenda, this.minutes,
                new Audit(this.auditId), this.createdAt, this.updatedAt);
    }
}
