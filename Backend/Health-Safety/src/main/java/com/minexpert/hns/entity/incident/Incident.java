package com.minexpert.hns.entity.incident;

import java.time.LocalDateTime;

import com.minexpert.hns.dto.IncidentDTO;
import com.minexpert.hns.entity.parameters.Location;
import com.minexpert.hns.entity.parameters.WeatherCondition;
import com.minexpert.hns.entity.parameters.WorkArea;
import com.minexpert.hns.entity.parameters.WorkProcess;
import com.minexpert.hns.enums.IncidentStatus;
import com.minexpert.hns.utility.StringListConverter;

import jakarta.persistence.Column;
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
public class Incident {
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;
        @Column(unique = true)
        private String number;
        private String title;
        private String ppe;
        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "location_id", nullable = false)
        private Location location;
        private String weatherConditions;
        private Long departmentId;
        private LocalDateTime occurredAt;
        private LocalDateTime discoveryTime;
        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "work_area_id", nullable = false)
        private WorkArea workArea;
        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "work_process_id", nullable = false)
        private WorkProcess workProcess;
        private Long reporterId;
        private IncidentStatus status;
        private String involvedPersons;
        private String witnesses;
        private String evidence;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public IncidentDTO toDTO() {
                return new IncidentDTO(id, number, title, StringListConverter.convertToStringList(ppe),
                                location != null ? location.getId() : null,
                                StringListConverter.convertToLongList(weatherConditions), departmentId,
                                status, occurredAt, discoveryTime, workArea != null ? workArea.getId() : null,
                                workProcess != null ? workProcess.getId() : null, null, reporterId,
                                StringListConverter.convertToLongList(involvedPersons),
                                StringListConverter.convertToLongList(witnesses),
                                null, null, null, null, null, null, null,
                                null, null, null, null, null, null);
        }

        public Incident(Long id) {
                this.id = id;
        }
}
