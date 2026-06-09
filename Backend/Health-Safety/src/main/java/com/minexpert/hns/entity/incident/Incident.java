package com.minexpert.hns.entity.incident;

import java.time.LocalDateTime;

import com.minexpert.hns.dto.IncidentDTO;
import com.minexpert.hns.entity.parameters.Location;
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
        @Column(name = "company_id", nullable = false)
        private Long companyId;
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
        /**
         * Origine de la declaration. Valeurs : EMPLOYEE (saisie manuelle) | AI (assistee par IA Vision).
         * Permet de tracer les incidents declares via le wizard IA vs les declarations classiques.
         * Default EMPLOYEE pour les enregistrements existants.
         */
        @Column(name = "source", length = 20)
        private String source;
        /** Confiance IA (0-1) si source=AI, sinon null. */
        @Column(name = "ai_confidence")
        private Double aiConfidence;
        /** Modele IA utilise (ex: claude-sonnet-4-5) si source=AI. */
        @Column(name = "ai_model", length = 64)
        private String aiModel;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public IncidentDTO toDTO() {
                IncidentDTO dto = new IncidentDTO();
                dto.setId(id);
                dto.setNumber(number);
                dto.setTitle(title);
                dto.setPpe(StringListConverter.convertToStringList(ppe));
                dto.setLocationId(location != null ? location.getId() : null);
                dto.setWeatherConditions(StringListConverter.convertToLongList(weatherConditions));
                dto.setDepartmentId(departmentId);
                dto.setCompanyId(companyId);
                dto.setStatus(status);
                dto.setOccurredAt(occurredAt);
                dto.setDiscoveryTime(discoveryTime);
                dto.setWorkAreaId(workArea != null ? workArea.getId() : null);
                dto.setWorkProcessId(workProcess != null ? workProcess.getId() : null);
                dto.setReporterId(reporterId);
                dto.setInvolvedPersons(StringListConverter.convertToLongList(involvedPersons));
                dto.setWitnesses(StringListConverter.convertToLongList(witnesses));
                dto.setSource(source != null ? source : "EMPLOYEE");
                dto.setAiConfidence(aiConfidence);
                dto.setAiModel(aiModel);
                return dto;
        }

        public Incident(Long id) {
                this.id = id;
        }
}
