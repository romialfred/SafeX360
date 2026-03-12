package com.minexpert.hns.entity.activities;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import com.minexpert.hns.entity.parameters.Location;
import com.minexpert.hns.entity.planning.Activity;
import com.minexpert.hns.enums.ActivityStatus;
import com.minexpert.hns.enums.ActivityType;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class HsActivity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "activity_id", nullable = false, unique = true)
    private Activity activity;
    private ActivityType type;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id", nullable = false)
    private Location location;
    private LocalDate plannedDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String objectives;
    private String agenda;
    private String expectedResults;
    private String ppe;
    private String participants;
    @Enumerated(EnumType.STRING)
    private ActivityStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public HsActivity(Long id) {
        this.id = id;
    }

    // public HsActivityDetails toDetails() {
    // return new HsActivityDetails(id, null, type,
    // location != null ? location.getName() : null,
    // plannedDate, startTime, endTime, objectives, agenda,
    // expectedResults, StringListConverter.convertToStringList(ppe), null, status);
    // }
}
