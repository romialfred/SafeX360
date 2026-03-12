package com.minexpert.hns.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import com.minexpert.hns.dto.response.GeneralInspectionDetails;
import com.minexpert.hns.entity.parameters.Location;
import com.minexpert.hns.entity.planning.Activity;
import com.minexpert.hns.enums.InspectionStatus;
import com.minexpert.hns.utility.StringListConverter;

import jakarta.persistence.Entity;
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

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class GeneralInspection {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "activity_id", nullable = false, unique = true)
    private Activity activity;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "site_id", nullable = false)
    private Location site;
    private LocalDate plannedDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String description;
    private String objectives;
    private String riskTypes;
    private String ppe;
    private String participants;
    private InspectionStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public GeneralInspectionDetails toDetails() {
        return new GeneralInspectionDetails(id, activity != null ? activity.getTitle() : null,
                activity != null ? activity.getId() : null,
                site != null ? site.getName() : null, site != null ? site.getId() : null,
                plannedDate, startTime, endTime, description, objectives,
                StringListConverter.convertToStringList(riskTypes),
                StringListConverter.convertToStringList(ppe),
                null, status);
    }

    public GeneralInspection(Long id) {
        this.id = id;
    }
}
