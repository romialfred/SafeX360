package com.minexpert.hns.entity.audit;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import com.minexpert.hns.dto.audit.AreaExecutionDTO;
import com.minexpert.hns.utility.StringListConverter;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class AreaExecution {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String topic;
    private LocalDate interviewDate;
    private String location;
    private LocalTime startTime;
    private LocalTime endTime;
    private String attendees;
    private String findings;
    private String evidence;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "area_id", nullable = false)
    private Area area;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public AreaExecutionDTO toDTO() {
        return new AreaExecutionDTO(id, topic, interviewDate, location, startTime, endTime,
                StringListConverter.convertStringToParticipantsDTO(attendees), findings, null,
                area != null ? area.getId() : null,
                createdAt, updatedAt);
    }
}
