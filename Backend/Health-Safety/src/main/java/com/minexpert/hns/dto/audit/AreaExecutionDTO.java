package com.minexpert.hns.dto.audit;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import com.minexpert.hns.dto.MediaDTO;
import com.minexpert.hns.dto.ParticipantDTO;
import com.minexpert.hns.entity.audit.Area;
import com.minexpert.hns.entity.audit.AreaExecution;
import com.minexpert.hns.utility.StringListConverter;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AreaExecutionDTO {
    private Long id;
    private String topic;
    private LocalDate interviewDate;
    private String location;
    private LocalTime startTime;
    private LocalTime endTime;
    private List<ParticipantDTO> attendees;
    private String findings;
    private List<MediaDTO> evidence;
    private Long areaId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public AreaExecution toEntity() {
        return new AreaExecution(this.id, this.topic, this.interviewDate, this.location, this.startTime,
                this.endTime, StringListConverter.convertParticipantsToString(attendees), this.findings, null,
                new Area(areaId),
                this.createdAt, this.updatedAt);
    }
}
