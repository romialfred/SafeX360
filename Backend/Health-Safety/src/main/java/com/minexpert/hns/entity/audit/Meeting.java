package com.minexpert.hns.entity.audit;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import com.minexpert.hns.dto.audit.MeetingDTO;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Meeting {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
    private String agenda;
    private String minutes;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audit_id", nullable = false)
    private Audit audit;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** LOT 52 — type de réunion ISO 19011 §6.4 : OPENING / CLOSING / OTHER. */
    private String type;

    /** LOT 52 — participants au format JSON [{employeeId,name,present}]. */
    @Lob
    private String attendees;

    public Meeting(Long id) {
        this.id = id;
    }

    public MeetingDTO toDTO() {
        return new MeetingDTO(id, date, startTime, endTime, agenda, minutes,
                audit != null ? audit.getId() : null, createdAt, updatedAt, type, attendees);
    }
}
