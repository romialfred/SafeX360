package com.minexpert.hns.dosimetry.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.minexpert.hns.dosimetry.enums.CampaignStatus;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Campagne de surveillance d'ambiance : agrege plusieurs points de mesure sur une periode pour
 * un objectif donne (etat initial, post-incident, audit reglementaire, etc.).
 *
 * <p>Les transitions de statut sont controlees par le service ({@code MonitoringCampaignService}).
 */
@Entity
@Table(name = "dosimetry_monitoring_campaign",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_monitoring_campaign_mine_code",
                        columnNames = {"mine_id", "code"})
        },
        indexes = {
                @Index(name = "idx_monitoring_campaign_mine_status",
                        columnList = "mine_id, status"),
                @Index(name = "idx_monitoring_campaign_start_date",
                        columnList = "start_date")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MonitoringCampaign {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "mine_id", nullable = false)
    private Long mineId;

    @Column(name = "code", nullable = false, length = 64)
    private String code;

    @Column(name = "label", nullable = false, length = 255)
    private String label;

    @Column(name = "objective", columnDefinition = "TEXT")
    private String objective;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 16)
    private CampaignStatus status;

    @Column(name = "protocol", columnDefinition = "TEXT")
    private String protocol;

    /** PCR/RPO en charge de la campagne. */
    @Column(name = "responsible_id")
    private Long responsibleId;

    /**
     * Liste des ids de points de mesure couverts par la campagne. Stockes dans une table
     * dediee {@code dosimetry_monitoring_campaign_point} via @ElementCollection.
     */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "dosimetry_monitoring_campaign_point",
            joinColumns = @JoinColumn(name = "campaign_id"),
            indexes = {
                    @Index(name = "idx_campaign_point_campaign", columnList = "campaign_id"),
                    @Index(name = "idx_campaign_point_point", columnList = "measurement_point_id")
            })
    @Column(name = "measurement_point_id", nullable = false)
    @Builder.Default
    private List<Long> measurementPointIds = new ArrayList<>();

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "updated_by")
    private Long updatedBy;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "completed_by")
    private Long completedBy;
}
