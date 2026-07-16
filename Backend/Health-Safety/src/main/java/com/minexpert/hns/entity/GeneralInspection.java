package com.minexpert.hns.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import com.minexpert.hns.dto.response.GeneralInspectionDetails;
import com.minexpert.hns.entity.inspections.InspectionTemplate;
import com.minexpert.hns.entity.parameters.Location;
import com.minexpert.hns.entity.planning.Activity;
import com.minexpert.hns.enums.InspectionStatus;
import com.minexpert.hns.utility.StringListConverter;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Inspection HSE — refonte 2026-06.
 *
 * <p>Une inspection lie une {@link Activity} planifiee (calendrier HSE
 * annuel) a un {@link InspectionTemplate} (modele de points de controle)
 * pour une cible donnee (equipement, lieu ou procedure).</p>
 *
 * <p><b>Workflow complet :</b></p>
 * <ol>
 *   <li>SCHEDULED — planifiee, prete pour le terrain</li>
 *   <li>IN_PROGRESS — inspecteur en train de saisir les findings (mobile)</li>
 *   <li>SUBMITTED — soumise pour validation equipe</li>
 *   <li>APPROVED / REJECTED — decision collegiale</li>
 *   <li>ARCHIVED — rapport fige, lecture seule</li>
 * </ol>
 *
 * <p><b>Compatibilite ascendante :</b> les colonnes legacy {@code ppe},
 * {@code riskTypes}, {@code participants} sont conservees pour les
 * inspections creees avant la refonte. Le nouveau frontend ne les utilise
 * plus (la section "EPI a porter" a ete retiree). Le service de migration
 * marque automatiquement les anciennes inspections en ARCHIVED.</p>
 */
@Entity
@Table(
        name = "general_inspection",
        indexes = {
                @Index(name = "idx_inspection_status", columnList = "status"),
                @Index(name = "idx_inspection_template", columnList = "template_id"),
                @Index(name = "idx_inspection_planned_date", columnList = "plannedDate"),
                @Index(name = "idx_inspection_site", columnList = "site_id")
        }
)
@Data
@AllArgsConstructor
@NoArgsConstructor
public class GeneralInspection {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    /**
     * Activité legacy (workflow simple, avant la refonte template). Désormais
     * OPTIONNELLE : les inspections planifiées via le nouveau workflow
     * (template + cible) n'en créent pas. Colonne relâchée en NULL (migration
     * relax_inspection_notnull.sql) — sinon toute planification violait la
     * contrainte NOT NULL puisque schedule() ne fournit pas d'activité.
     */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "activity_id", nullable = true, unique = true)
    private Activity activity;
    /**
     * Lieu physique de l'inspection. OPTIONNEL : dérivé de la cible (lieu de
     * rattachement de l'équipement, ou la localisation elle-même). La mine
     * (cloisonnement) est portée par {@link #companyId}, PAS par ce champ.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "site_id", nullable = true)
    private Location site;
    private LocalDate plannedDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String description;
    private String objectives;

    // ── Champs legacy (preserves pour rétro-compat) ──
    /** @deprecated Liste de types de risque (sérialisée). Remplacée par les checkpoints du template. */
    @Deprecated
    private String riskTypes;
    /** @deprecated Liste d'EPI requis (sérialisée). Section retirée de l'UI à la refonte. */
    @Deprecated
    private String ppe;
    /** @deprecated Participants sérialisés. Remplacé par InspectionApproval. */
    @Deprecated
    private String participants;

    /** Statut courant (workflow elargi : SCHEDULED → IN_PROGRESS → SUBMITTED → APPROVED → ARCHIVED). */
    @Enumerated(EnumType.STRING)
    @Column(length = 24)
    private InspectionStatus status;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // ── Nouveaux champs (refonte 2026-06) ──

    /**
     * Modele d'inspection applique (definit les points de controle). Nullable
     * pour les inspections legacy creees avant la refonte (qui restent
     * lisibles via le workflow simple). Pour toute inspection planifiee
     * apres la refonte, ce champ est obligatoire cote service.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id")
    private InspectionTemplate template;

    /**
     * Identifiant de la cible inspectee (equipment_id, location_id, ou
     * procedure_id selon {@link InspectionTemplate#getType()}). Polymorphe
     * volontairement : la resolution se fait cote service en fonction du
     * type du template, pour eviter une discrimination Hibernate lourde.
     */
    @Column(name = "target_ref_id")
    private Long targetRefId;

    /** Libelle affiche de la cible (denormalise pour eviter une jointure systematique). */
    @Column(name = "target_label", length = 200)
    private String targetLabel;

    /**
     * Synthese redigee par l'inspecteur (rapport texte modifiable jusqu'a
     * APPROVED). Stockee en LOB pour autoriser les rapports detailles avec
     * markdown leger.
     */
    @Column(columnDefinition = "TEXT")
    private String summaryReport;

    /** Date/heure de soumission pour validation equipe (passage SUBMITTED). */
    private LocalDateTime submittedAt;

    /** Date/heure d'approbation finale (100% approvers ont valide). */
    private LocalDateTime approvedAt;

    /** Date/heure d'archivage (lecture seule, post-validation). */
    private LocalDateTime archivedAt;

    /** ID de l'inspecteur principal qui a saisi la majorite des findings. */
    private Long primaryInspectorId;

    /**
     * Mine propriétaire (cloisonnement multi-site). Renseigné à la création
     * depuis le companyId de la requête (CompanyScopeFilter). Nullable pour
     * les données legacy (backfill=1). Filtré en lecture par le service.
     */
    private Long companyId;

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
